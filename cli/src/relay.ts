// WebSocket relay client + trace store + React hook.
// Mirrors the browser SharedWorker (app/workers/relay-worker.ts): one WebSocket
// to the room, heartbeat ping/pong, auto-reconnect with 3s backoff.

import { useEffect, useRef, useState } from 'react';
import type { Trace, Span, TraceEntry, WebSocketMessage } from './types';

export type RelayStatus = 'connecting' | 'connected' | 'disconnected';

const HEARTBEAT_MS = 30_000;
const RECONNECT_MS = 3_000;
const MAX_TRACES = 200;

interface RelayEvents {
  onStatus?: (status: RelayStatus) => void;
  onTrace?: (trace: Trace, spans: Span[]) => void;
  onViewerCount?: (count: number) => void;
  onClear?: () => void;
}

export function createRelay(wsUrl: string, events: RelayEvents) {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stopHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_MS);
  };

  function connect() {
    events.onStatus?.('connecting');
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      events.onStatus?.('connected');
      heartbeat = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, HEARTBEAT_MS);
    };

    ws.onmessage = (e) => {
      const raw = typeof e.data === 'string' ? e.data : String(e.data);
      if (raw === 'pong') return;

      let msg: WebSocketMessage;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'trace_update':
          events.onTrace?.(msg.data.trace, msg.data.spans);
          break;
        case 'viewer_count':
          events.onViewerCount?.(msg.count);
          break;
        case 'clear_data':
        case 'cleared_data':
          events.onClear?.();
          break;
        // log_update / metric_update: ignored for now (traces first)
      }
    };

    ws.onclose = () => {
      stopHeartbeat();
      events.onStatus?.('disconnected');
      if (!closed) scheduleReconnect();
    };

    // onerror is followed by onclose, which handles reconnect.
    ws.onerror = () => {};
  }

  connect();

  return {
    close() {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopHeartbeat();
      ws?.close();
    },
  };
}

// Accumulates traces and their spans, deduped by id. Spans for a trace may
// arrive across several messages, so merge additively.
class TraceStore {
  private traces = new Map<string, Trace>();
  private spans = new Map<string, Map<string, Span>>();

  upsert(trace: Trace, spans: Span[]) {
    const existing = this.traces.get(trace.trace_id);
    // Later messages win, but preserve a custom_name if a later update drops it.
    this.traces.set(trace.trace_id, { ...existing, ...trace });

    let bucket = this.spans.get(trace.trace_id);
    if (!bucket) {
      bucket = new Map();
      this.spans.set(trace.trace_id, bucket);
    }
    for (const span of spans) bucket.set(span.span_id, span);
  }

  clear() {
    this.traces.clear();
    this.spans.clear();
  }

  list(): TraceEntry[] {
    return [...this.traces.values()]
      .sort((a, b) => b.start_time - a.start_time)
      .slice(0, MAX_TRACES)
      .map((trace) => ({
        trace,
        spans: [...(this.spans.get(trace.trace_id)?.values() ?? [])],
      }));
  }
}

export interface LiveTraces {
  status: RelayStatus;
  viewers: number;
  traces: TraceEntry[];
  clear: () => void;
}

export function useLiveTraces(wsUrl: string): LiveTraces {
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const [viewers, setViewers] = useState(0);
  const [, bump] = useState(0);
  const store = useRef<TraceStore>(new TraceStore());

  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    const relay = createRelay(wsUrl, {
      onStatus: setStatus,
      onViewerCount: setViewers,
      onTrace: (trace, spans) => {
        store.current.upsert(trace, spans);
        rerender();
      },
      onClear: () => {
        store.current.clear();
        rerender();
      },
    });
    return () => relay.close();
  }, [wsUrl]);

  return {
    status,
    viewers,
    traces: store.current.list(),
    clear: () => {
      store.current.clear();
      bump((n) => n + 1);
    },
  };
}
