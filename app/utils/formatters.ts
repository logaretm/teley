// Utility functions for formatting trace data
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

export function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleString();
}

export function getStatusColor(statusCode: SpanStatusCode): string {
  switch (statusCode) {
    case SpanStatusCode.ERROR:
      return 'error';
    case SpanStatusCode.OK:
    case SpanStatusCode.UNSET:
    default:
      return 'success';
  }
}

export function getSpanKindLabel(kind: SpanKind): string {
  const kinds: Record<SpanKind, string> = {
    [SpanKind.INTERNAL]: 'Internal',
    [SpanKind.SERVER]: 'Server',
    [SpanKind.CLIENT]: 'Client',
    [SpanKind.PRODUCER]: 'Producer',
    [SpanKind.CONSUMER]: 'Consumer'
  };
  return kinds[kind] || 'Internal';
}
