// Main Cloudflare Worker entry point

import type { Env } from './types';
import {
  parseSentryEnvelope,
  processSentryEnvelope,
  parseOTLPTrace,
  parseOTLPLogs,
  parseOTLPMetrics,
  generateEventId,
} from '../../shared/parsers';

export { TelemetryRoom } from './durable-object';
export { SharedTrace } from './shared-trace';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    console.log('[Worker] Request:', request.method, url.pathname);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Sentry envelope endpoint: /api/{projectId}/envelope/
    if (url.pathname.match(/^\/api\/\d+\/envelope\/?$/) && request.method === 'POST') {
      console.log('[Worker] Sentry envelope endpoint matched');
      const roomId = extractRoomIdFromSentryAuth(request);
      console.log('[Worker] Extracted roomId:', roomId);
      if (!roomId) {
        return corsResponse(new Response('Missing room ID in X-Sentry-Auth', { status: 400 }));
      }
      return corsResponse(await handleSentryIngest(request, env, roomId));
    }

    // OTLP / WebSocket endpoint: /r/{roomId}
    const roomMatch = url.pathname.match(/^\/r\/([a-zA-Z0-9_-]+)$/);
    if (roomMatch) {
      const roomId = roomMatch[1];

      if (request.headers.get('Upgrade') === 'websocket') {
        return handleWebSocket(request, env, roomId);
      }

      if (request.method === 'POST') {
        return corsResponse(await handleOTLPIngest(request, env, roomId));
      }
    }

    // Share API: store a trace snapshot
    if (url.pathname === '/api/share' && request.method === 'POST') {
      try {
        const body = await request.json();
        const id = crypto.randomUUID().slice(0, 12);
        const doId = env.SHARED_TRACE.idFromName(id);
        const stub = env.SHARED_TRACE.get(doId);
        await stub.fetch(new Request('http://internal/store', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }));
        return corsResponse(new Response(JSON.stringify({ id }), {
          headers: { 'Content-Type': 'application/json' },
        }));
      } catch (error: any) {
        return corsResponse(new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    // Share API: retrieve a trace snapshot
    const shareMatch = url.pathname.match(/^\/api\/share\/([a-zA-Z0-9_-]+)$/);
    if (shareMatch && request.method === 'GET') {
      const id = shareMatch[1];
      const doId = env.SHARED_TRACE.idFromName(id);
      const stub = env.SHARED_TRACE.get(doId);
      const response = await stub.fetch(new Request('http://internal/retrieve'));
      return corsResponse(response);
    }

    // Static assets
    if (env.ASSETS) {
      // Try to serve the exact file first
      const response = await env.ASSETS.fetch(request);

      // If not found and it's a navigation request (not a file), serve index.html for SPA
      if (response.status === 404 && !url.pathname.includes('.')) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        return env.ASSETS.fetch(indexRequest);
      }

      return response;
    }

    return new Response('Not Found', { status: 404 });
  },
};

function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sentry-Auth, sentry-trace, baggage',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function corsResponse(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-Sentry-Auth, sentry-trace, baggage');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function extractRoomIdFromSentryAuth(request: Request): string | null {
  // Check X-Sentry-Auth header first
  const auth = request.headers.get('x-sentry-auth') || '';
  const headerMatch = auth.match(/sentry_key=([a-zA-Z0-9_-]+)/);
  if (headerMatch) {
    return headerMatch[1];
  }

  // Fall back to query string (sentry_key parameter)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('sentry_key');
  if (queryKey) {
    return queryKey;
  }

  return null;
}

async function handleSentryIngest(request: Request, env: Env, roomId: string): Promise<Response> {
  console.log('[Worker] handleSentryIngest called, roomId:', roomId);

  try {
    const rawBody = await request.text();
    console.log('[Worker] Sentry envelope body length:', rawBody.length);

    if (!rawBody) {
      return new Response(JSON.stringify({ error: 'Empty envelope body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse Sentry envelope
    const envelope = parseSentryEnvelope(rawBody);
    console.log('[Worker] Parsed envelope, items:', envelope.items.length);

    // Convert Sentry data to OTLP format
    const result = processSentryEnvelope(envelope);
    console.log('[Worker] Processed envelope, traces:', result.traces.length, 'spans:', result.spans.length, 'logs:', result.logs.length);

    // Broadcast each trace update
    for (const trace of result.traces) {
      const traceSpans = result.spans.filter(s => s.trace_id === trace.trace_id);
      await broadcastToRoom(env, roomId, {
        type: 'trace_update',
        data: { trace, spans: traceSpans },
      });
    }

    // Broadcast each log update
    for (const log of result.logs) {
      await broadcastToRoom(env, roomId, {
        type: 'log_update',
        data: { log },
      });
    }

    // Broadcast each metric update
    for (const metric of result.metrics) {
      await broadcastToRoom(env, roomId, {
        type: 'metric_update',
        data: { metric },
      });
    }

    const eventId = envelope.headers.event_id || generateEventId();

    return new Response(JSON.stringify({ id: eventId, status: 'success' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Sentry] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleOTLPIngest(request: Request, env: Env, roomId: string): Promise<Response> {
  console.log('[Worker] handleOTLPIngest called, roomId:', roomId);

  try {
    const contentType = request.headers.get('content-type') || '';
    const body = await request.json() as Record<string, any>;
    console.log('[Worker] OTLP body keys:', Object.keys(body));

    // Detect if this is traces or logs based on the payload
    if (body.resourceSpans) {
      // OTLP Traces
      const result = parseOTLPTrace(body);

      for (const trace of result.traces) {
        const traceSpans = result.spans.filter(s => s.trace_id === trace.trace_id);
        await broadcastToRoom(env, roomId, {
          type: 'trace_update',
          data: { trace, spans: traceSpans },
        });
      }

      return new Response(JSON.stringify({ status: 'success', tracesReceived: result.traces.length }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (body.resourceLogs) {
      // OTLP Logs
      const result = parseOTLPLogs(body);

      for (const log of result.logs) {
        await broadcastToRoom(env, roomId, {
          type: 'log_update',
          data: { log },
        });
      }

      return new Response(JSON.stringify({ status: 'success', logsReceived: result.logs.length }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (body.resourceMetrics) {
      // OTLP Metrics
      const result = parseOTLPMetrics(body);

      for (const metric of result.metrics) {
        await broadcastToRoom(env, roomId, {
          type: 'metric_update',
          data: { metric },
        });
      }

      return new Response(JSON.stringify({ status: 'success', metricsReceived: result.metrics.length }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid OTLP payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('[OTLP] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleWebSocket(request: Request, env: Env, roomId: string): Promise<Response> {
  console.log('[Worker] handleWebSocket called, roomId:', roomId);
  const doId = env.TELEMETRY_ROOM.idFromName(roomId);
  const room = env.TELEMETRY_ROOM.get(doId);
  return room.fetch(request);
}

async function broadcastToRoom(env: Env, roomId: string, data: any): Promise<void> {
  console.log('[Worker] broadcastToRoom called, roomId:', roomId, 'type:', data.type);

  const doId = env.TELEMETRY_ROOM.idFromName(roomId);
  const room = env.TELEMETRY_ROOM.get(doId);

  console.log('[Worker] Sending to Durable Object...');
  const response = await room.fetch(new Request('http://internal/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }));
  console.log('[Worker] Durable Object response:', response.status);
}
