// Static mock telemetry for --demo mode (and for iterating on the UI).

import type { TraceEntry, Span, TraceSource } from './types';

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
