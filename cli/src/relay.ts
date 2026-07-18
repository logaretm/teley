// WebSocket relay client + trace store + React hook.
// Mirrors the browser SharedWorker (app/workers/relay-worker.ts): one WebSocket
// to the room, heartbeat ping/pong, auto-reconnect with exponential backoff.

import { useEffect, useRef, useState } from 'react';
import type { Trace, Span, Log, TraceEntry, WebSocketMessage } from './types';
import { summarizeTrace } from '../../shared/parsers/trace-summary';

// 'rejected' is terminal: the relay refused the handshake (room already claimed
// or token mismatch) and we stop retrying.
export type RelayStatus = 'connecting' | 'connected' | 'disconnected' | 'rejected';

const HEARTBEAT_MS = 30_000;
// Exponential backoff for reconnects: base doubles each attempt up to a cap,
// with jitter to avoid a thundering herd against a recovering relay.
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const MAX_TRACES = 200;
const MAX_LOGS = 500;

// Bun reports a non-101 handshake response (e.g. the relay's 401/400) as a
// close with code 1002, distinct from an established socket dropping (1006).
const HANDSHAKE_REJECTED_CODE = 1002;

interface RelayEvents {
  onStatus?: (status: RelayStatus) => void;
  onReject?: (reason: string) => void;
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
  let reconnectAttempts = 0;
  // Set once the socket reaches OPEN; lets onclose tell a handshake rejection
  // (never opened) apart from an established connection dropping.
  let opened = false;
  // True while a ping is outstanding. If the next heartbeat tick fires before a
  // pong clears it, the socket is half-open (dead) and we force a reconnect.
  let awaitingPong = false;

  const stopHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    const backoff = Math.min(
      RECONNECT_BASE_MS * 2 ** reconnectAttempts,
      RECONNECT_MAX_MS,
    );
    // Full jitter: a random point in [0, backoff].
    const delay = Math.random() * backoff;
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
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
      opened = true;
      reconnectAttempts = 0;
      awaitingPong = false;
      events.onStatus?.('connected');
      heartbeat = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (awaitingPong) {
          // No pong since the last ping: the socket is half-open. Close it so
          // onclose runs and schedules a reconnect.
          ws.close();
          return;
        }
        awaitingPong = true;
        ws.send('ping');
      }, HEARTBEAT_MS);
    };

    ws.onmessage = (e) => {
      const raw = typeof e.data === 'string' ? e.data : String(e.data);
      if (raw === 'pong') {
        awaitingPong = false;
        return;
      }

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

    ws.onclose = (e) => {
      stopHeartbeat();
      awaitingPong = false;
      if (closed) return;

      // A close before the socket ever opened, with the non-101 handshake code,
      // means the relay refused us: the room is already claimed by another
      // token, or the token mismatches. Retrying can never succeed, so stop and
      // surface it instead of reconnecting forever.
      if (!opened && e.code === HANDSHAKE_REJECTED_CODE) {
        events.onStatus?.('rejected');
        events.onReject?.('Relay rejected the connection: room already claimed or token mismatch.');
        return;
      }

      events.onStatus?.('disconnected');
      scheduleReconnect();
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
  error: string | null;
  viewers: number;
  traces: TraceEntry[];
  logs: Log[];
  clear: () => void;
}

export function useLiveData(wsUrl: string): LiveData {
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [, bump] = useState(0);
  const traceStore = useRef<TraceStore>(new TraceStore());
  const logStore = useRef<LogStore>(new LogStore());

  useEffect(() => {
    setError(null);
    const rerender = () => bump((n) => n + 1);
    const relay = createRelay(wsUrl, {
      onStatus: setStatus,
      onReject: setError,
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
    error,
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
