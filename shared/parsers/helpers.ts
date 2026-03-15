// Pure utility functions for parsing telemetry data

export interface IKeyValue {
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

/**
 * Convert hex string or Uint8Array to readable hex string
 */
export function hexToString(hex: string | Uint8Array): string {
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

/**
 * Convert nano timestamp to milliseconds
 */
export function nanoToMs(nano: string | number): number {
  return Math.floor(Number(nano) / 1000000);
}

/**
 * Extract attribute value from OTLP KeyValue format
 */
export function getAttributeValue(value: IKeyValue['value']): any {
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

/**
 * Convert OTLP attributes array to object
 */
export function parseAttributes(attributes?: IKeyValue[]): Record<string, any> {
  if (!attributes) return {};

  const result: Record<string, any> = {};
  for (const attr of attributes) {
    result[attr.key] = getAttributeValue(attr.value);
  }
  return result;
}

/**
 * Generate a random trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Generate a random span ID (16 hex characters)
 */
export function generateSpanId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Generate a Sentry-compatible event ID (32 hex characters)
 */
export function generateEventId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

/**
 * Generate a unique log ID
 */
export function generateLogId(timestamp: number): string {
  return `${timestamp}-${Math.random().toString(36).substring(2, 11)}`;
}
