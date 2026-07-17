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
import {
  handleCORS,
  corsResponse,
  extractRoomIdFromSentryAuth,
  isTraceRequest,
  isLogsRequest,
  isMetricsRequest,
} from './util';

export { TelemetryRoom } from './durable-object';

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
    if (isTraceRequest(body)) {
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
    } else if (isLogsRequest(body)) {
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
    } else if (isMetricsRequest(body)) {
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
