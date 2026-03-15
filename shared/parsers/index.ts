// Barrel export for shared parsers

// Types
export * from './types';

// Helpers
export {
  hexToString,
  nanoToMs,
  parseAttributes,
  getAttributeValue,
  generateTraceId,
  generateSpanId,
  generateEventId,
  generateLogId,
  generateMetricId,
  type IKeyValue,
} from './helpers';

// Sentry parser
export {
  parseSentryEnvelope,
  parseSentryDSN,
  type SentryEnvelope,
  type SentryEnvelopeHeaders,
  type SentryEnvelopeItem,
  type SentryItemHeaders,
} from './sentry-parser';

// OTLP parser
export {
  parseOTLPTrace,
  parseOTLPLogs,
  parseOTLPMetrics,
  type IExportTraceServiceRequest,
  type IExportLogsServiceRequest,
  type IExportMetricsServiceRequest,
  type ParsedTrace,
  type ParsedSpan,
  type ParsedLog,
  type ParsedMetric,
  type ParsedTraceResult,
  type ParsedLogsResult,
  type ParsedMetricsResult,
} from './otlp-parser';

// Sentry to OTLP converter
export {
  processSentryEnvelope,
  type SentryConversionResult,
} from './sentry-to-otlp';
