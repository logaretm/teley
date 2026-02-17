import type { Trace, Span } from '../../shared/parsers/types';

export interface SpanTreeNode {
  span: Span;
  depth: number;
  offsetPercent: number;
  widthPercent: number;
  matchKey: string;
}

export function buildSpanTree(spans: Span[], trace: Trace): SpanTreeNode[] {
  const spanMap = new Map<string, Span>();
  const children = new Map<string | null, Span[]>();

  for (const span of spans) {
    spanMap.set(span.span_id, span);

    const parentId = span.parent_span_id;
    if (!children.has(parentId)) {
      children.set(parentId, []);
    }
    children.get(parentId)!.push(span);
  }

  // Find root spans (no parent or parent not in this trace)
  const rootSpans = spans.filter((span) => {
    return !span.parent_span_id || !spanMap.has(span.parent_span_id);
  });

  rootSpans.sort((a, b) => a.start_time - b.start_time);

  const result: SpanTreeNode[] = [];
  const traceStart = trace.start_time;
  const traceDuration = trace.duration;

  function traverse(span: Span, depth: number) {
    const offsetPercent =
      ((span.start_time - traceStart) / traceDuration) * 100;
    const widthPercent = (span.duration / traceDuration) * 100;

    result.push({
      span,
      depth,
      offsetPercent: Math.max(0, offsetPercent),
      widthPercent: Math.max(0.5, widthPercent),
      matchKey: `${span.name}|${span.kind}|${depth}`,
    });

    const childSpans = children.get(span.span_id) || [];
    childSpans.sort((a, b) => a.start_time - b.start_time);

    for (const child of childSpans) {
      traverse(child, depth + 1);
    }
  }

  for (const rootSpan of rootSpans) {
    traverse(rootSpan, 0);
  }

  return result;
}
