// Recompute trace summary metadata from the full set of accumulated spans.
//
// Streamed (Sentry v2) spans arrive one flush at a time, so each `trace_update`
// carries only a slice of a trace's spans. The per-message trace record the
// worker sends is therefore computed from just that slice. Consumers accumulate
// spans additively, then call this to derive stable timing / operation name /
// status from everything seen so far. It is order-independent and also corrects
// the same flip-flop for OTLP traces whose spans span multiple batches.

import type { Trace, Span } from './types';

export function summarizeTrace(base: Trace, spans: Span[]): Trace {
  if (spans.length === 0) return base;

  const spanIds = new Set(spans.map((s) => s.span_id));

  // Root = the span whose parent is absent from the set (the segment span for
  // streamed traces). Falls back to the earliest span if none is parentless.
  const root =
    spans.find((s) => !s.parent_span_id || !spanIds.has(s.parent_span_id)) ??
    spans.reduce((a, b) => (b.start_time < a.start_time ? b : a));

  let start_time = Infinity;
  let end_time = -Infinity;
  let errored: Span | undefined;
  for (const s of spans) {
    if (s.start_time < start_time) start_time = s.start_time;
    if (s.end_time > end_time) end_time = s.end_time;
    if (!errored && s.status_code === 2) errored = s;
  }

  return {
    ...base,
    operation_name: root.name || base.operation_name,
    start_time,
    end_time,
    duration: end_time - start_time,
    status_code: errored ? 2 : base.status_code,
    status_message: errored ? errored.status_message : base.status_message,
  };
}
