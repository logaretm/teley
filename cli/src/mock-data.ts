// Static mock telemetry for --demo mode (and for iterating on the UI).

import type { TraceEntry, Span, Log, TraceSource } from './types';

let seq = 0;

interface SpanSpec {
  id: string; // local handle used for parent references
  parent: string | null;
  name: string;
  kind: number; // OTLP: 1=Internal 2=Server 3=Client 4=Producer 5=Consumer
  start: number;
  duration: number;
  service: string; // used only to derive the trace's service_name from the root
  status?: number; // 2 = error
  attributes?: Record<string, unknown>;
}

function buildTrace(source: TraceSource, specs: SpanSpec[]): TraceEntry {
  const traceId = `trace${(++seq).toString().padStart(2, '0')}`;
  const idMap = new Map<string, string>();
  for (const s of specs) idMap.set(s.id, `${traceId}-${s.id}`);

  const spans: Span[] = specs.map((s) => ({
    span_id: idMap.get(s.id)!,
    trace_id: traceId,
    parent_span_id: s.parent ? idMap.get(s.parent)! : null,
    name: s.name,
    kind: s.kind,
    start_time: s.start,
    end_time: s.start + s.duration,
    duration: s.duration,
    status_code: s.status ?? 0,
    status_message: s.status === 2 ? 'connection reset by peer' : null,
    attributes: s.attributes ?? {},
    events: [],
    links: [],
  }));

  const root = specs[0]!;
  return {
    trace: {
      trace_id: traceId,
      service_name: root.service,
      operation_name: root.name,
      start_time: spans[0]!.start_time,
      end_time: spans[0]!.end_time,
      duration: spans[0]!.duration,
      status_code: spans[0]!.status_code,
      status_message: spans[0]!.status_message,
      source,
    },
    spans,
  };
}

export const MOCK_TRACES: TraceEntry[] = [
  // Failed checkout — an error trace with a deep client call chain
  buildTrace('SENTRY', [
    { id: 'root', parent: null, name: 'POST /checkout', kind: 2, start: 0, duration: 318, service: 'api-gateway', status: 2, attributes: { 'http.method': 'POST', 'http.route': '/checkout', 'http.status_code': 500 } },
    { id: 'validate', parent: 'root', name: 'validate.cart', kind: 1, start: 2, duration: 8, service: 'api-gateway', attributes: { 'cart.items': 3 } },
    { id: 'user', parent: 'root', name: 'GET user-service', kind: 3, start: 12, duration: 46, service: 'api-gateway' },
    { id: 'userdb', parent: 'user', name: 'db.query users', kind: 3, start: 20, duration: 30, service: 'user-service', attributes: { 'db.system': 'postgresql', 'db.statement': 'SELECT * FROM users WHERE id = $1' } },
    { id: 'pay', parent: 'root', name: 'POST payment-service', kind: 3, start: 62, duration: 240, service: 'api-gateway', status: 2 },
    { id: 'stripe', parent: 'pay', name: 'stripe.charge', kind: 3, start: 70, duration: 224, service: 'payment-service', status: 2, attributes: { 'peer.service': 'stripe', error: true } },
    { id: 'idem', parent: 'root', name: 'cache.set idempotency', kind: 3, start: 306, duration: 6, service: 'payment-service' },
  ]),

  // Healthy user fetch
  buildTrace('OTLP', [
    { id: 'root', parent: null, name: 'GET /api/users', kind: 2, start: 0, duration: 41, service: 'api-gateway', attributes: { 'http.method': 'GET', 'http.route': '/api/users', 'http.status_code': 200 } },
    { id: 'auth', parent: 'root', name: 'auth.verify', kind: 1, start: 1, duration: 5, service: 'api-gateway' },
    { id: 'user', parent: 'root', name: 'GET user-service', kind: 3, start: 7, duration: 30, service: 'api-gateway' },
    { id: 'userdb', parent: 'user', name: 'db.query users', kind: 3, start: 12, duration: 18, service: 'user-service', attributes: { 'db.system': 'postgresql' } },
  ]),

  // Background job consumer
  buildTrace('OTLP', [
    { id: 'root', parent: null, name: 'process.order.queue', kind: 5, start: 0, duration: 156, service: 'worker', attributes: { 'messaging.system': 'sqs' } },
    { id: 'db', parent: 'root', name: 'db.query orders', kind: 3, start: 4, duration: 40, service: 'worker', attributes: { 'db.system': 'postgresql' } },
    { id: 'render', parent: 'root', name: 'render.invoice', kind: 1, start: 48, duration: 60, service: 'worker' },
    { id: 'email', parent: 'root', name: 'POST email-service', kind: 3, start: 110, duration: 42, service: 'worker' },
  ]),
];

interface LogSpec {
  ago: number; // seconds before "now" the log was emitted
  severity: number; // OTLP severity number
  service: string;
  body: string;
  trace_id?: string;
  span_id?: string;
  attributes?: Record<string, unknown>;
}

const LOG_SPECS: LogSpec[] = [
  { ago: 42, severity: 9, service: 'api-gateway', body: 'GET /api/users 200 41ms', attributes: { 'http.method': 'GET', 'http.status_code': 200 } },
  { ago: 38, severity: 5, service: 'user-service', body: 'cache hit for user:4821', attributes: { 'cache.key': 'user:4821' } },
  { ago: 30, severity: 13, service: 'payment-service', body: 'stripe latency above threshold (224ms)', attributes: { 'peer.service': 'stripe', threshold_ms: 200 } },
  { ago: 24, severity: 9, service: 'worker', body: 'processed order queue batch of 12', attributes: { 'messaging.system': 'sqs', batch: 12 } },
  { ago: 18, severity: 17, service: 'payment-service', body: 'stripe.charge failed: connection reset by peer', trace_id: 'trace01', span_id: 'trace01-stripe', attributes: { 'peer.service': 'stripe', 'http.status_code': 500, error: true } },
  { ago: 12, severity: 17, service: 'api-gateway', body: 'POST /checkout 500 318ms', trace_id: 'trace01', span_id: 'trace01-root', attributes: { 'http.method': 'POST', 'http.status_code': 500 } },
  { ago: 6, severity: 13, service: 'user-service', body: 'slow query: SELECT * FROM users WHERE id = $1 (30ms)', attributes: { 'db.system': 'postgresql' } },
  { ago: 2, severity: 9, service: 'worker', body: 'invoice rendered and emailed', attributes: { 'messaging.system': 'sqs' } },
];

// Built lazily so timestamps are relative to launch, not module load.
export function buildMockLogs(): Log[] {
  const now = Date.now();
  return LOG_SPECS.map((s, i) => ({
    log_id: `log${(i + 1).toString().padStart(2, '0')}`,
    timestamp: now - s.ago * 1000,
    trace_id: s.trace_id ?? null,
    span_id: s.span_id ?? null,
    severity_number: s.severity,
    severity_text: null,
    body: s.body,
    service_name: s.service,
    attributes: s.attributes ?? {},
  }));
}
