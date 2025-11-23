import type { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export type TraceSource = 'OTLP' | 'SENTRY';

export interface Trace {
  trace_id: string;
  service_name: string;
  operation_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: SpanStatusCode;
  status_message: string | null;
  source: TraceSource;
  created_at: number;
}

export interface Span {
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  name: string;
  kind: SpanKind;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: SpanStatusCode;
  status_message: string | null;
  attributes: string; // JSON string
  events: string; // JSON string
  links: string; // JSON string
}

export interface ParsedSpan
  extends Omit<Span, 'attributes' | 'events' | 'links'> {
  attributes: Record<string, unknown>;
  events: Array<{
    time: number;
    name: string;
    attributes: Record<string, unknown>;
  }>;
  links: Array<{
    traceId: string;
    spanId: string;
    traceState?: string;
    attributes: Record<string, unknown>;
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
  attributes: string; // JSON string
  created_at: number;
}

export interface ParsedLog extends Omit<Log, 'attributes'> {
  attributes: Record<string, unknown>;
}

export interface WebSocketTraceUpdateMessage {
  type: 'trace_update';
  data: TraceUpdateData;
}

export interface WebSocketLogUpdateMessage {
  type: 'log_update';
  data: LogUpdateData;
}

export interface WebSocketClearDataMessage {
  type: 'clear_data';
}

export interface WebSocketInfoMessage {
  type: 'connected' | 'cleared_data';
  message: string;
}

export type WebSocketMessage =
  | WebSocketTraceUpdateMessage
  | WebSocketLogUpdateMessage
  | WebSocketClearDataMessage
  | WebSocketInfoMessage;

export interface TraceUpdateData {
  trace: Trace;
  spans: Span[];
}

export interface LogUpdateData {
  log: Log;
}

// API response types
export interface TracesResponse {
  traces: Trace[];
}

export interface TraceDetailsResponse {
  trace: Trace;
  spans: Span[];
}

export interface LogsResponse {
  logs: Log[];
}
