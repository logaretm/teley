// OTLP Parser for OpenTelemetry Protocol
// Reference: https://opentelemetry.io/docs/specs/otlp/

import type { SpanStatusCode } from '@opentelemetry/api';
import type { TraceSource } from '@types';

interface IKeyValue {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string | number;
    doubleValue?: number;
    boolValue?: boolean;
    arrayValue?: { values: any[] };
    kvlistValue?: { values: IKeyValue[] };
    bytesValue?: string;
  };
}

interface IEvent {
  timeUnixNano: string;
  name: string;
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
}

interface ILink {
  traceId: string;
  spanId: string;
  traceState?: string;
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
}

interface IStatus {
  message?: string;
  code?: SpanStatusCode;
}

interface ISpan {
  traceId: string;
  spanId: string;
  traceState?: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
  events?: IEvent[];
  droppedEventsCount?: number;
  links?: ILink[];
  droppedLinksCount?: number;
  status?: IStatus;
}

interface IInstrumentationScope {
  name?: string;
  version?: string;
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
}

interface IScopeSpans {
  scope?: IInstrumentationScope;
  spans: ISpan[];
  schemaUrl?: string;
}

interface IResource {
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
}

interface IResourceSpans {
  resource?: IResource;
  scopeSpans?: IScopeSpans[];
  schemaUrl?: string;
}

interface IExportTraceServiceRequest {
  resourceSpans: IResourceSpans[];
}

// OTLP Logs interfaces
interface ILogRecord {
  timeUnixNano: string;
  observedTimeUnixNano?: string;
  severityNumber?: number;
  severityText?: string;
  body?: {
    stringValue?: string;
    intValue?: string | number;
    doubleValue?: number;
    boolValue?: boolean;
    arrayValue?: { values: any[] };
    kvlistValue?: { values: IKeyValue[] };
    bytesValue?: string;
  };
  attributes?: IKeyValue[];
  droppedAttributesCount?: number;
  traceId?: string;
  spanId?: string;
}

interface IScopeLogs {
  scope?: IInstrumentationScope;
  logRecords: ILogRecord[];
  schemaUrl?: string;
}

interface IResourceLogs {
  resource?: IResource;
  scopeLogs?: IScopeLogs[];
  schemaUrl?: string;
}

interface IExportLogsServiceRequest {
  resourceLogs: IResourceLogs[];
}

// Convert hex string to readable hex
function hexToString(hex: string | Uint8Array): string {
  if (!hex) return '';

  // Handle Uint8Array (binary data)
  if (hex instanceof Uint8Array) {
    return Array.from(hex)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Handle string
  if (typeof hex === 'string') {
    // If already hex string, return as is
    if (/^[0-9a-f]+$/i.test(hex)) {
      return hex;
    }
    // If base64, decode it
    try {
      const binary = atob(hex);
      return Array.from(binary)
        .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return hex;
    }
  }

  return String(hex);
}

// Convert nano timestamp to milliseconds
function nanoToMs(nano: string | number): number {
  return Math.floor(Number(nano) / 1000000);
}

// Extract attribute value
function getAttributeValue(value: IKeyValue['value']): any {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.intValue !== undefined) return Number(value.intValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.arrayValue !== undefined) {
    return value.arrayValue.values.map((v) => getAttributeValue(v));
  }
  if (value.kvlistValue !== undefined) {
    return parseAttributes(value.kvlistValue.values);
  }
  if (value.bytesValue !== undefined) return value.bytesValue;
  return null;
}

// Convert attributes array to object
function parseAttributes(attributes?: IKeyValue[]): Record<string, any> {
  if (!attributes) return {};

  const result: Record<string, any> = {};
  for (const attr of attributes) {
    result[attr.key] = getAttributeValue(attr.value);
  }
  return result;
}

export async function processOTLPTrace(
  otlpData: IExportTraceServiceRequest,
  source: TraceSource = 'OTLP',
) {
  const traces = new Map<string, any>();
  const spans: any[] = [];

  for (const resourceSpan of otlpData.resourceSpans) {
    const resourceAttrs = parseAttributes(resourceSpan.resource?.attributes);
    const serviceName = resourceAttrs['service.name'] || 'unknown';

    for (const scopeSpan of resourceSpan.scopeSpans || []) {
      for (const otlpSpan of scopeSpan.spans) {
        const traceId = hexToString(otlpSpan.traceId);
        const spanId = hexToString(otlpSpan.spanId);
        const parentSpanId = otlpSpan.parentSpanId
          ? hexToString(otlpSpan.parentSpanId)
          : null;

        const startTime = nanoToMs(otlpSpan.startTimeUnixNano);
        const endTime = nanoToMs(otlpSpan.endTimeUnixNano);
        const duration = endTime - startTime;

        const attributes = parseAttributes(otlpSpan.attributes);
        const statusCode = otlpSpan.status?.code || 0;
        const statusMessage = otlpSpan.status?.message || null;

        // Parse events
        const events = (otlpSpan.events || []).map((event) => ({
          time: nanoToMs(event.timeUnixNano),
          name: event.name,
          attributes: parseAttributes(event.attributes),
        }));

        // Parse links
        const links = (otlpSpan.links || []).map((link) => ({
          traceId: hexToString(link.traceId),
          spanId: hexToString(link.spanId),
          traceState: link.traceState,
          attributes: parseAttributes(link.attributes),
        }));

        // Track trace metadata
        if (!traces.has(traceId)) {
          traces.set(traceId, {
            trace_id: traceId,
            service_name: serviceName,
            operation_name: otlpSpan.name,
            start_time: startTime,
            end_time: endTime,
            duration: duration,
            status_code: statusCode,
            status_message: statusMessage,
            source: source,
          });
        } else {
          // Update trace timing if this span extends it
          const trace = traces.get(traceId);
          if (startTime < trace.start_time) trace.start_time = startTime;
          if (endTime > trace.end_time) {
            trace.end_time = endTime;
            trace.duration = trace.end_time - trace.start_time;
          }
          // Update status if error (ERROR = 2)
          if (statusCode === 2 && trace.status_code !== 2) {
            trace.status_code = statusCode;
            trace.status_message = statusMessage;
          }
        }

        // Store span
        spans.push({
          span_id: spanId,
          trace_id: traceId,
          parent_span_id: parentSpanId,
          name: otlpSpan.name,
          kind: otlpSpan.kind,
          start_time: startTime,
          end_time: endTime,
          duration: duration,
          status_code: statusCode,
          status_message: statusMessage,
          attributes: JSON.stringify(attributes),
          events: JSON.stringify(events),
          links: JSON.stringify(links),
        });
      }
    }
  }

  // Update trace operation names to use root span names
  for (const trace of traces.values()) {
    const traceSpans = spans.filter((s) => s.trace_id === trace.trace_id);
    const spanMap = new Map(traceSpans.map((s) => [s.span_id, s]));

    // Find root span (no parent or parent not in this trace)
    const rootSpan = traceSpans.find(
      (s) => !s.parent_span_id || !spanMap.has(s.parent_span_id),
    );

    if (rootSpan) {
      trace.operation_name = rootSpan.name;
    }
  }

  // Insert into database
  for (const trace of traces.values()) {
    await insertTrace(trace);
  }

  for (const span of spans) {
    await insertSpan(span);
  }

  // Return trace IDs that were updated
  return Array.from(traces.keys());
}

// Extract log body value
function getLogBodyValue(body?: ILogRecord['body']): string {
  if (!body) return '';

  if (body.stringValue !== undefined) return body.stringValue;
  if (body.intValue !== undefined) return String(body.intValue);
  if (body.doubleValue !== undefined) return String(body.doubleValue);
  if (body.boolValue !== undefined) return String(body.boolValue);
  if (body.arrayValue !== undefined) {
    return JSON.stringify(
      body.arrayValue.values.map((v) => getAttributeValue(v)),
    );
  }
  if (body.kvlistValue !== undefined) {
    return JSON.stringify(parseAttributes(body.kvlistValue.values));
  }
  if (body.bytesValue !== undefined) return body.bytesValue;

  return '';
}

export async function processOTLPLogs(otlpData: IExportLogsServiceRequest) {
  const logs: any[] = [];

  for (const resourceLog of otlpData.resourceLogs) {
    const resourceAttrs = parseAttributes(resourceLog.resource?.attributes);
    const serviceName = resourceAttrs['service.name'] || 'unknown';

    for (const scopeLog of resourceLog.scopeLogs || []) {
      for (const logRecord of scopeLog.logRecords) {
        const timestamp = nanoToMs(logRecord.timeUnixNano);
        const traceId = logRecord.traceId
          ? hexToString(logRecord.traceId)
          : null;
        const spanId = logRecord.spanId ? hexToString(logRecord.spanId) : null;

        const severityNumber = logRecord.severityNumber || 0;
        const severityText = logRecord.severityText || null;
        const body = getLogBodyValue(logRecord.body);
        const attributes = parseAttributes(logRecord.attributes);

        // Generate a unique log ID (timestamp + random component)
        const logId = `${timestamp}-${Math.random().toString(36).substring(2, 11)}`;

        logs.push({
          log_id: logId,
          timestamp,
          trace_id: traceId,
          span_id: spanId,
          severity_number: severityNumber,
          severity_text: severityText,
          body,
          service_name: serviceName,
          attributes: JSON.stringify(attributes),
        });
      }
    }
  }

  // Insert into database
  for (const log of logs) {
    await insertLog(log);
  }

  // Return log IDs that were inserted
  return logs.map((log) => log.log_id);
}
