// Shared types for telemetry data

export type TraceSource = 'OTLP' | 'SENTRY';

export interface Trace {
  trace_id: string;
  service_name: string;
  operation_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: number;
  status_message: string | null;
  source: TraceSource;
  created_at?: number;
}

export interface Span {
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  name: string;
  kind: number;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: number;
  status_message: string | null;
  attributes: Record<string, any>;
  events: Array<{
    time: number;
    name: string;
    attributes: Record<string, any>;
  }>;
  links: Array<{
    traceId: string;
    spanId: string;
    traceState?: string;
    attributes: Record<string, any>;
  }>;
}

export interface Log {
  log_id: string;
  timestamp: number;
  trace_id: string | null;
  span_id: string | null;
  severity_number: number;
  severity_text: string | null;
  body: string;
  service_name: string;
  attributes: Record<string, any>;
  created_at?: number;
}

// WebSocket message types
export interface WebSocketTraceUpdateMessage {
  type: 'trace_update';
  data: {
    trace: Trace;
    spans: Span[];
  };
}

export interface WebSocketLogUpdateMessage {
  type: 'log_update';
  data: {
    log: Log;
  };
}

export interface WebSocketClearDataMessage {
  type: 'clear_data';
}

export interface WebSocketViewerCountMessage {
  type: 'viewer_count';
  count: number;
}

export interface WebSocketInfoMessage {
  type: 'connected' | 'cleared_data';
  message: string;
}

export type WebSocketMessage =
  | WebSocketTraceUpdateMessage
  | WebSocketLogUpdateMessage
  | WebSocketClearDataMessage
  | WebSocketViewerCountMessage
  | WebSocketInfoMessage;
