// WebSocket relay client + trace store + React hook.
// Mirrors the browser SharedWorker (app/workers/relay-worker.ts): one WebSocket
// to the room, heartbeat ping/pong, auto-reconnect with 3s backoff.

import { useEffect, useRef, useState } from 'react';
import type { Trace, Span, Log, TraceEntry, WebSocketMessage } from './types';
import { summarizeTrace } from '../../shared/parsers/trace-summary';

export type RelayStatus = 'connecting' | 'connected' | 'disconnected';

const HEARTBEAT_MS = 30_000;
const RECONNECT_MS = 3_000;
const MAX_TRACES = 200;
const MAX_LOGS = 500;

interface RelayEvents {
  onStatus?: (status: RelayStatus) => void;
  onTrace?: (trace: Trace, spans: Span[]) => void;
  onLog?: (log: Log) => void;
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
        case 'log_update':
          events.onLog?.(msg.data.log);
          break;
        case 'viewer_count':
          events.onViewerCount?.(msg.count);
          break;
        case 'clear_data':
        case 'cleared_data':
          events.onClear?.();
          break;
        // metric_update: ignored for now
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
    let bucket = this.spans.get(trace.trace_id);
    if (!bucket) {
      bucket = new Map();
      this.spans.set(trace.trace_id, bucket);
    }
    for (const span of spans) bucket.set(span.span_id, span);

    const existing = this.traces.get(trace.trace_id);
    // Later messages win, but preserve a custom_name if a later update drops it.
    // Recompute timing/operation/status from all accumulated spans so streamed
    // (Sentry v2) spans arriving across messages build a stable trace summary.
    const merged = { ...existing, ...trace };
    this.traces.set(trace.trace_id, summarizeTrace(merged, [...bucket.values()]));
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

// Accumulates logs, deduped by id, newest first, capped at MAX_LOGS.
class LogStore {
  private logs = new Map<string, Log>();

  upsert(log: Log) {
    this.logs.set(log.log_id, log);
  }

  clear() {
    this.logs.clear();
  }

  list(): Log[] {
    return [...this.logs.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_LOGS);
  }
}

export interface LiveData {
  status: RelayStatus;
  viewers: number;
  traces: TraceEntry[];
  logs: Log[];
  clear: () => void;
}

export function useLiveData(wsUrl: string): LiveData {
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const [viewers, setViewers] = useState(0);
  const [, bump] = useState(0);
  const traceStore = useRef<TraceStore>(new TraceStore());
  const logStore = useRef<LogStore>(new LogStore());

  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    const relay = createRelay(wsUrl, {
      onStatus: setStatus,
      onViewerCount: setViewers,
      onTrace: (trace, spans) => {
        traceStore.current.upsert(trace, spans);
        rerender();
      },
      onLog: (log) => {
        logStore.current.upsert(log);
        rerender();
      },
      onClear: () => {
        traceStore.current.clear();
        logStore.current.clear();
        rerender();
      },
    });
    return () => relay.close();
  }, [wsUrl]);

  return {
    status,
    viewers,
    traces: traceStore.current.list(),
    logs: logStore.current.list(),
    clear: () => {
      traceStore.current.clear();
      logStore.current.clear();
      bump((n) => n + 1);
    },
  };
}
