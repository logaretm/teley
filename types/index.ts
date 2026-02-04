// Re-export shared types for backward compatibility
export type {
  TraceSource,
  Trace,
  Span,
  Log,
  WebSocketTraceUpdateMessage,
  WebSocketLogUpdateMessage,
  WebSocketClearDataMessage,
  WebSocketInfoMessage,
  WebSocketMessage,
} from '../shared/parsers/types';

// Parsed span type with deserialized JSON fields
export interface ParsedSpan {
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

// Parsed log type with deserialized JSON fields
export interface ParsedLog {
  log_id: string;
  timestamp: number;
  trace_id: string | null;
  span_id: string | null;
  severity_number: number;
  severity_text: string | null;
  body: string;
  service_name: string;
  attributes: Record<string, unknown>;
  created_at?: number;
}

// Trace update data for WebSocket messages
export interface TraceUpdateData {
  trace: import('../shared/parsers/types').Trace;
  spans: import('../shared/parsers/types').Span[];
}

// Log update data for WebSocket messages
export interface LogUpdateData {
  log: import('../shared/parsers/types').Log;
}

// API response types (kept for potential future use)
export interface TracesResponse {
  traces: import('../shared/parsers/types').Trace[];
}

export interface TraceDetailsResponse {
  trace: import('../shared/parsers/types').Trace;
  spans: import('../shared/parsers/types').Span[];
}

export interface LogsResponse {
  logs: import('../shared/parsers/types').Log[];
}
