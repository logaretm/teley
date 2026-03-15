// Convert Sentry data formats to OTLP
// This allows Sentry SDK data to be stored and displayed in our OTLP viewer

import type { SentryEnvelope } from './sentry-parser';
import type { MetricType } from './types';
import {
  parseOTLPTrace,
  parseOTLPLogs,
  type ParsedTrace,
  type ParsedSpan,
  type ParsedLog,
  type ParsedMetric,
} from './otlp-parser';
import { generateTraceId, generateSpanId, generateMetricId } from './helpers';

export interface SentryConversionResult {
  traces: ParsedTrace[];
  spans: ParsedSpan[];
  logs: ParsedLog[];
  metrics: ParsedMetric[];
}

/**
 * Process a Sentry envelope and convert items to OTLP format
 */
export function processSentryEnvelope(envelope: SentryEnvelope): SentryConversionResult {
  const result: SentryConversionResult = {
    traces: [],
    spans: [],
    logs: [],
    metrics: [],
  };

  for (const item of envelope.items) {
    const itemType = item.headers.type;
    console.log('[Sentry] Processing item type:', itemType);

    try {
      switch (itemType) {
        case 'transaction': {
          // Sentry transaction -> OTLP trace
          const parsed = convertSentryTransaction(item.payload);
          result.traces.push(...parsed.traces);
          result.spans.push(...parsed.spans);
          break;
        }

        case 'event': {
          // Sentry error event -> OTLP log
          const parsed = convertSentryEvent(item.payload);
          result.logs.push(...parsed.logs);
          break;
        }

        case 'log': {
          // Sentry log item -> OTLP log
          console.log('[Sentry] Log payload:', JSON.stringify(item.payload));
          const parsed = convertSentryLog(item.payload);
          result.logs.push(...parsed.logs);
          break;
        }

        case 'trace_metric': {
          // Sentry v10+ trace_metric format
          const parsed = convertSentryTraceMetrics(item.payload);
          result.metrics.push(...parsed);
          break;
        }

        case 'span':
        case 'session':
        case 'client_report':
        case 'attachment':
          // Not supported
          break;
      }
    } catch (error: any) {
      console.error(`[Sentry] Error processing ${itemType}:`, error.message);
    }
  }

  return result;
}

/**
 * Convert Sentry transaction to OTLP trace
 */
function convertSentryTransaction(transaction: any): { traces: ParsedTrace[]; spans: ParsedSpan[] } {
  const traceId = transaction.contexts?.trace?.trace_id || generateTraceId();
  const spanId = transaction.contexts?.trace?.span_id || generateSpanId();

  const serviceName = transaction.sdk?.name || 'sentry-app';
  const startTime = transaction.start_timestamp
    ? Math.floor(transaction.start_timestamp * 1000)
    : Date.now();
  const endTime = transaction.timestamp
    ? Math.floor(transaction.timestamp * 1000)
    : Date.now();

  // Convert transaction to OTLP root span
  const rootSpan = {
    traceId: traceId,
    spanId: spanId,
    name:
      transaction.transaction ||
      transaction.spans?.[0]?.description ||
      'unknown',
    kind: mapSentrySpanKind(transaction.contexts?.trace?.op),
    startTimeUnixNano: String(startTime * 1_000_000),
    endTimeUnixNano: String(endTime * 1_000_000),
    attributes: convertAttributes({
      'sentry.transaction': transaction.transaction,
      'sentry.op': transaction.contexts?.trace?.op,
      'sentry.status': transaction.contexts?.trace?.status,
      ...transaction.tags,
    }),
    status: {
      code: transaction.contexts?.trace?.status === 'ok' ? 1 : 2,
      message: transaction.contexts?.trace?.status,
    },
  };

  // Convert child spans
  const childSpans = (transaction.spans || []).map((sentrySpan: any) => {
    const spanStartTime = sentrySpan.start_timestamp
      ? Math.floor(sentrySpan.start_timestamp * 1000)
      : startTime;
    const spanEndTime = sentrySpan.timestamp
      ? Math.floor(sentrySpan.timestamp * 1000)
      : endTime;

    return {
      traceId: traceId,
      spanId: sentrySpan.span_id || generateSpanId(),
      parentSpanId: sentrySpan.parent_span_id || spanId,
      name: sentrySpan.description || sentrySpan.op || 'span',
      kind: mapSentrySpanKind(sentrySpan.op),
      startTimeUnixNano: String(spanStartTime * 1_000_000),
      endTimeUnixNano: String(spanEndTime * 1_000_000),
      attributes: convertAttributes({
        'sentry.op': sentrySpan.op,
        'sentry.status': sentrySpan.status,
        ...sentrySpan.tags,
        ...sentrySpan.data,
      }),
      status: {
        code: sentrySpan.status === 'ok' ? 1 : 2,
      },
    };
  });

  // Build OTLP trace structure
  const otlpTrace = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: serviceName } },
          ],
        },
        scopeSpans: [
          {
            spans: [rootSpan, ...childSpans],
          },
        ],
      },
    ],
  };

  // Process via OTLP parser, marking as SENTRY source
  return parseOTLPTrace(otlpTrace, 'SENTRY');
}

/**
 * Convert Sentry error event to OTLP log
 */
function convertSentryEvent(event: any): { logs: ParsedLog[] } {
  const timestamp = event.timestamp
    ? Math.floor(event.timestamp * 1000)
    : Date.now();
  const serviceName = event.sdk?.name || 'sentry-app';

  // Determine severity from Sentry level
  const severityMap: Record<string, number> = {
    fatal: 21,
    error: 17,
    warning: 13,
    info: 9,
    debug: 5,
  };
  const severityNumber = severityMap[event.level] || 9; // Default to INFO

  // Build log message from exception or message
  let body = event.message || '';
  if (event.exception?.values?.length > 0) {
    const ex = event.exception.values[0];
    body = `${ex.type}: ${ex.value}`;

    // Add stacktrace if available
    if (ex.stacktrace?.frames?.length > 0) {
      body += '\n\nStack trace:\n';
      ex.stacktrace.frames.forEach((frame: any) => {
        body += `  at ${frame.function} (${frame.filename}:${frame.lineno})\n`;
      });
    }
  }

  // Create OTLP log record
  const logRecord = {
    timeUnixNano: String(timestamp * 1_000_000),
    severityNumber: severityNumber,
    severityText: event.level?.toUpperCase(),
    body: {
      stringValue: body,
    },
    attributes: convertAttributes({
      'sentry.event_id': event.event_id,
      'sentry.platform': event.platform,
      'sentry.environment': event.environment,
      'sentry.release': event.release,
      ...event.tags,
      ...event.user,
    }),
    traceId: event.contexts?.trace?.trace_id,
    spanId: event.contexts?.trace?.span_id,
  };

  const otlpLogs = {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: serviceName } },
          ],
        },
        scopeLogs: [
          {
            logRecords: [logRecord],
          },
        ],
      },
    ],
  };

  // Process via OTLP parser
  return parseOTLPLogs(otlpLogs);
}

/**
 * Convert Sentry log item to OTLP log
 */
function convertSentryLog(logItem: any): { logs: ParsedLog[] } {
  // Sentry log items can contain multiple log records in an "items" array
  const items = logItem.items || [logItem];
  const logs: ParsedLog[] = [];

  for (const log of items) {
    const timestamp = log.timestamp
      ? Math.floor(log.timestamp * 1000)
      : Date.now();

    // Map Sentry log level to OTLP severity
    const severityMap: Record<string, number> = {
      trace: 1,
      debug: 5,
      info: 9,
      warn: 13,
      warning: 13,
      error: 17,
      fatal: 21,
    };
    const level = log.level || log.severity || 'info';
    const severityNumber = severityMap[level.toLowerCase()] || 9;

    const logRecord = {
      timeUnixNano: String(timestamp * 1_000_000),
      severityNumber: severityNumber,
      severityText: level.toUpperCase(),
      body: {
        stringValue: log.message || log.body || '',
      },
      attributes: convertAttributes({
        ...log.attributes,
        ...log.data,
      }),
      traceId: log.trace_id,
      spanId: log.span_id,
    };

    const otlpLogs = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: log.service || 'sentry-app' } },
            ],
          },
          scopeLogs: [
            {
              logRecords: [logRecord],
            },
          ],
        },
      ],
    };

    const parsed = parseOTLPLogs(otlpLogs);
    logs.push(...parsed.logs);
  }

  return { logs };
}

/**
 * Map Sentry operation to OTLP span kind
 */
function mapSentrySpanKind(op?: string): number {
  if (!op) return 0; // INTERNAL

  if (op.startsWith('http.server')) return 1; // SERVER
  if (op.startsWith('http.client')) return 3; // CLIENT
  if (op.includes('request') || op.includes('fetch')) return 3; // CLIENT
  if (op.includes('db') || op.includes('query')) return 3; // CLIENT

  return 0; // INTERNAL
}

/**
 * Convert Sentry tags/data to OTLP attributes format
 */
function convertAttributes(data: Record<string, any>) {
  return Object.entries(data)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      key,
      value: {
        stringValue:
          typeof value === 'object' ? JSON.stringify(value) : String(value),
      },
    }));
}

/**
 * Convert Sentry v10+ trace_metric items to metrics
 * Format: { items: [{ timestamp, trace_id, span_id, name, type, unit, value, attributes }] }
 */
function convertSentryTraceMetrics(payload: any): ParsedMetric[] {
  if (!payload || typeof payload !== 'object') return [];

  const items = payload.items || [payload];
  const metrics: ParsedMetric[] = [];

  for (const item of items) {
    try {
      const timestamp = item.timestamp
        ? Math.floor(item.timestamp * 1000)
        : Date.now();

      const typeMap: Record<string, MetricType> = {
        counter: 'counter',
        gauge: 'gauge',
        distribution: 'histogram',
      };
      const metricType = typeMap[item.type] || 'gauge';

      // Unwrap Sentry v10 attribute format: { value: "...", type: "string" } -> plain values
      const rawAttrs = item.attributes || {};
      const attributes: Record<string, any> = {};
      for (const [key, val] of Object.entries(rawAttrs)) {
        attributes[key] = val && typeof val === 'object' && 'value' in val ? (val as any).value : val;
      }
      if (item.trace_id) attributes['trace_id'] = item.trace_id;
      if (item.span_id) attributes['span_id'] = item.span_id;

      const serviceName = String(attributes['sentry.sdk.name'] || 'sentry-app');

      if (metricType === 'histogram') {
        const value = Number(item.value) || 0;
        metrics.push({
          metric_id: generateMetricId(timestamp),
          name: item.name,
          description: null,
          unit: item.unit || null,
          type: 'histogram',
          service_name: serviceName,
          timestamp,
          value: null,
          histogram: {
            buckets: [],
            sum: value,
            count: 1,
            min: value,
            max: value,
          },
          set_values: null,
          attributes,
          source: 'SENTRY',
        });
      } else {
        metrics.push({
          metric_id: generateMetricId(timestamp),
          name: item.name,
          description: null,
          unit: item.unit || null,
          type: metricType,
          service_name: serviceName,
          timestamp,
          value: Number(item.value) || 0,
          histogram: null,
          set_values: null,
          attributes,
          source: 'SENTRY',
        });
      }
    } catch (error: any) {
      console.error('[Sentry] Error parsing trace_metric:', error.message);
    }
  }

  return metrics;
}
