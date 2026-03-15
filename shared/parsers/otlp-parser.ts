// OTLP Parser for OpenTelemetry Protocol
// Reference: https://opentelemetry.io/docs/specs/otlp/
// Pure parsing functions that return data without side effects

import type { TraceSource, MetricType, HistogramData } from './types';
import {
  hexToString,
  nanoToMs,
  parseAttributes,
  getAttributeValue,
  generateLogId,
  generateMetricId,
  type IKeyValue,
} from './helpers';

// OTLP Trace interfaces
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
  code?: number;
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

export interface IExportTraceServiceRequest {
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

export interface IExportLogsServiceRequest {
  resourceLogs: IResourceLogs[];
}

// Output types
export interface ParsedTrace {
  trace_id: string;
  service_name: string;
  operation_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: number;
  status_message: string | null;
  source: TraceSource;
}

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
  attributes: Record<string, any>;
  events: Array<{
    time: number;
    name: string;
    attributes: Record<string, any>;
  }>;
  links: Array<{
    traceId: string;
    spanId: string;
    traceState?: string;
    attributes: Record<string, any>;
  }>;
}

export interface ParsedLog {
  log_id: string;
  timestamp: number;
  trace_id: string | null;
  span_id: string | null;
  severity_number: number;
  severity_text: string | null;
  body: string;
  service_name: string;
  attributes: Record<string, any>;
}

export interface ParsedTraceResult {
  traces: ParsedTrace[];
  spans: ParsedSpan[];
}

export interface ParsedLogsResult {
  logs: ParsedLog[];
}

/**
 * Parse OTLP trace data without side effects
 */
export function parseOTLPTrace(
  otlpData: IExportTraceServiceRequest,
  source: TraceSource = 'OTLP'
): ParsedTraceResult {
  const traces = new Map<string, ParsedTrace>();
  const spans: ParsedSpan[] = [];

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
          const trace = traces.get(traceId)!;
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
          attributes,
          events,
          links,
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
      (s) => !s.parent_span_id || !spanMap.has(s.parent_span_id)
    );

    if (rootSpan) {
      trace.operation_name = rootSpan.name;
    }
  }

  return {
    traces: Array.from(traces.values()),
    spans,
  };
}

/**
 * Extract log body value
 */
function getLogBodyValue(body?: ILogRecord['body']): string {
  if (!body) return '';

  if (body.stringValue !== undefined) return body.stringValue;
  if (body.intValue !== undefined) return String(body.intValue);
  if (body.doubleValue !== undefined) return String(body.doubleValue);
  if (body.boolValue !== undefined) return String(body.boolValue);
  if (body.arrayValue !== undefined) {
    return JSON.stringify(
      body.arrayValue.values.map((v) => getAttributeValue(v))
    );
  }
  if (body.kvlistValue !== undefined) {
    return JSON.stringify(parseAttributes(body.kvlistValue.values));
  }
  if (body.bytesValue !== undefined) return body.bytesValue;

  return '';
}

/**
 * Parse OTLP logs data without side effects
 */
export function parseOTLPLogs(otlpData: IExportLogsServiceRequest): ParsedLogsResult {
  const logs: ParsedLog[] = [];

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

        const severityNumber = logRecord.severityNumber || 9; // Default to INFO
        const severityText = logRecord.severityText || null;
        const body = getLogBodyValue(logRecord.body);
        const attributes = parseAttributes(logRecord.attributes);

        logs.push({
          log_id: generateLogId(timestamp),
          timestamp,
          trace_id: traceId,
          span_id: spanId,
          severity_number: severityNumber,
          severity_text: severityText,
          body,
          service_name: serviceName,
          attributes,
        });
      }
    }
  }

  return { logs };
}

// OTLP Metrics interfaces
interface INumberDataPoint {
  attributes?: IKeyValue[];
  startTimeUnixNano?: string;
  timeUnixNano: string;
  asDouble?: number;
  asInt?: string | number;
  exemplars?: any[];
}

interface IHistogramDataPoint {
  attributes?: IKeyValue[];
  startTimeUnixNano?: string;
  timeUnixNano: string;
  count: string | number;
  sum?: number;
  min?: number;
  max?: number;
  bucketCounts: (string | number)[];
  explicitBounds: number[];
  exemplars?: any[];
}

interface IOTLPMetric {
  name: string;
  description?: string;
  unit?: string;
  sum?: {
    dataPoints: INumberDataPoint[];
    aggregationTemporality?: number;
    isMonotonic?: boolean;
  };
  gauge?: {
    dataPoints: INumberDataPoint[];
  };
  histogram?: {
    dataPoints: IHistogramDataPoint[];
    aggregationTemporality?: number;
  };
}

interface IScopeMetrics {
  scope?: IInstrumentationScope;
  metrics: IOTLPMetric[];
  schemaUrl?: string;
}

interface IResourceMetrics {
  resource?: IResource;
  scopeMetrics?: IScopeMetrics[];
  schemaUrl?: string;
}

export interface IExportMetricsServiceRequest {
  resourceMetrics: IResourceMetrics[];
}

export interface ParsedMetric {
  metric_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  type: MetricType;
  service_name: string;
  timestamp: number;
  value: number | null;
  histogram: HistogramData | null;
  set_values: string[] | null;
  attributes: Record<string, any>;
  source: TraceSource;
}

export interface ParsedMetricsResult {
  metrics: ParsedMetric[];
}

/**
 * Parse OTLP metrics data without side effects
 */
export function parseOTLPMetrics(
  otlpData: IExportMetricsServiceRequest,
  source: TraceSource = 'OTLP'
): ParsedMetricsResult {
  const metrics: ParsedMetric[] = [];

  for (const resourceMetric of otlpData.resourceMetrics) {
    const resourceAttrs = parseAttributes(resourceMetric.resource?.attributes);
    const serviceName = resourceAttrs['service.name'] || 'unknown';

    for (const scopeMetric of resourceMetric.scopeMetrics || []) {
      for (const metric of scopeMetric.metrics) {
        const baseName = metric.name;
        const description = metric.description || null;
        const unit = metric.unit || null;

        if (metric.sum) {
          for (const dp of metric.sum.dataPoints) {
            const timestamp = nanoToMs(dp.timeUnixNano);
            const value = dp.asDouble ?? Number(dp.asInt ?? 0);
            metrics.push({
              metric_id: generateMetricId(timestamp),
              name: baseName,
              description,
              unit,
              type: 'counter',
              service_name: serviceName,
              timestamp,
              value,
              histogram: null,
              set_values: null,
              attributes: parseAttributes(dp.attributes),
              source,
            });
          }
        }

        if (metric.gauge) {
          for (const dp of metric.gauge.dataPoints) {
            const timestamp = nanoToMs(dp.timeUnixNano);
            const value = dp.asDouble ?? Number(dp.asInt ?? 0);
            metrics.push({
              metric_id: generateMetricId(timestamp),
              name: baseName,
              description,
              unit,
              type: 'gauge',
              service_name: serviceName,
              timestamp,
              value,
              histogram: null,
              set_values: null,
              attributes: parseAttributes(dp.attributes),
              source,
            });
          }
        }

        if (metric.histogram) {
          for (const dp of metric.histogram.dataPoints) {
            const timestamp = nanoToMs(dp.timeUnixNano);
            const buckets = dp.explicitBounds.map((bound, i) => ({
              bound,
              count: Number(dp.bucketCounts[i] ?? 0),
            }));
            // Add the overflow bucket
            if (dp.bucketCounts.length > dp.explicitBounds.length) {
              buckets.push({
                bound: Infinity,
                count: Number(dp.bucketCounts[dp.explicitBounds.length] ?? 0),
              });
            }

            metrics.push({
              metric_id: generateMetricId(timestamp),
              name: baseName,
              description,
              unit,
              type: 'histogram',
              service_name: serviceName,
              timestamp,
              value: null,
              histogram: {
                buckets,
                sum: dp.sum ?? 0,
                count: Number(dp.count),
                min: dp.min ?? 0,
                max: dp.max ?? 0,
              },
              set_values: null,
              attributes: parseAttributes(dp.attributes),
              source,
            });
          }
        }
      }
    }
  }

  return { metrics };
}
