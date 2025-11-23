// Convert Sentry data formats to OTLP
// This allows Sentry SDK data to be stored and displayed in our OTLP viewer

import type { SentryEnvelope } from './sentry-parser';

/**
 * Process a Sentry envelope and convert items to OTLP format
 */
export async function processSentryEnvelope(envelope: SentryEnvelope) {
  console.log(
    '[Sentry] Processing envelope with',
    envelope.items.length,
    'items',
  );

  const processedTraces: string[] = [];
  const processedLogs: string[] = [];

  for (const item of envelope.items) {
    const itemType = item.headers.type;
    console.log('[Sentry] Processing item type:', itemType);

    try {
      switch (itemType) {
        case 'transaction':
          // Sentry transaction -> OTLP trace
          const traceIds = await processSentryTransaction(item.payload);
          processedTraces.push(...traceIds);
          break;

        case 'event':
          // Sentry error event -> OTLP log
          const logIds = await processSentryEvent(item.payload);
          processedLogs.push(...logIds);
          break;

        case 'span':
          console.log('[Sentry] Standalone span items not yet supported');
          break;

        case 'session':
        case 'client_report':
        case 'attachment':
          console.log('[Sentry] Item type not supported:', itemType);
          break;
      }
    } catch (error: any) {
      console.error(`[Sentry] Error processing ${itemType}:`, error.message);
    }
  }

  return {
    traces: processedTraces,
    logs: processedLogs,
  };
}

/**
 * Convert Sentry transaction to OTLP trace
 */
async function processSentryTransaction(transaction: any) {
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

  // Build OTLP trace
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

  // Process via existing OTLP handler, marking as SENTRY source
  const traceIds = await processOTLPTrace(otlpTrace, 'SENTRY');
  console.log('[Sentry] Converted transaction to trace:', traceIds);

  return traceIds;
}

/**
 * Convert Sentry error event to OTLP log
 */
async function processSentryEvent(event: any) {
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
  const severityNumber = severityMap[event.level] || 17; // Default to ERROR

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

  // Process via existing OTLP handler
  const logIds = await processOTLPLogs(otlpLogs);
  console.log('[Sentry] Converted event to log:', logIds);

  return logIds;
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
 * Convert Sentry tags/data to OTLP attributes
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
 * Generate a random trace ID (32 hex characters)
 * Uses crypto.randomUUID (32 hex chars when dashes removed)
 */
function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Generate a random span ID (16 hex characters)
 * Uses half of a UUID
 */
function generateSpanId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}
