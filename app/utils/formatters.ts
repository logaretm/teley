// Utility functions for formatting trace data
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { TraceSource } from '@types';

export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

export function formatDurationCompact(ms: number): string {
  if (ms === 0) return '0ms';
  if (ms < 1) {
    const val = ms * 1000;
    return `${parseFloat(val.toFixed(1))}µs`;
  } else if (ms < 1000) {
    return `${parseFloat(ms.toFixed(1))}ms`;
  } else {
    return `${parseFloat((ms / 1000).toFixed(1))}s`;
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
    [SpanKind.CONSUMER]: 'Consumer',
  };
  return kinds[kind] || 'Internal';
}

// Log severity mapping (OTLP spec: severity numbers 1-24)
export function getSeverityLabel(
  severityNumber: number,
  severityText?: string | null,
): string {
  if (severityText) {
    return severityText.toUpperCase();
  }

  // Map severity numbers to standard levels
  if (severityNumber >= 21) return 'FATAL';
  if (severityNumber >= 17) return 'ERROR';
  if (severityNumber >= 13) return 'WARN';
  if (severityNumber >= 9) return 'INFO';
  if (severityNumber >= 5) return 'DEBUG';
  if (severityNumber >= 1) return 'TRACE';
  return 'UNSET';
}

export function getSourceLabel(source: TraceSource): string {
  if (source === 'SENTRY') return 'Sentry';
  if (source === 'OTLP') return 'OTLP';

  return source;
}
