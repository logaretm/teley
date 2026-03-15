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
  type IExportTraceServiceRequest,
  type IExportLogsServiceRequest,
  type ParsedTrace,
  type ParsedSpan,
  type ParsedLog,
  type ParsedTraceResult,
  type ParsedLogsResult,
} from './otlp-parser';

// Sentry to OTLP converter
export {
  processSentryEnvelope,
  type SentryConversionResult,
} from './sentry-to-otlp';
