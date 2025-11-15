import type { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export interface Trace {
  trace_id: string;
  service_name: string;
  operation_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: SpanStatusCode;
  status_message: string | null;
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

// WebSocket message types
export interface WebSocketMessage {
  type: 'connected' | 'trace_update' | 'clear_data';
  data?: TraceUpdateData;
  message?: string;
}

export interface TraceUpdateData {
  trace: Trace;
  spans: Span[];
}

// API response types
export interface TracesResponse {
  traces: Trace[];
}

export interface TraceDetailsResponse {
  trace: Trace;
  spans: Span[];
}
