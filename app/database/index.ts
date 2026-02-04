// Client-side IndexedDB database using Dexie.js

import Dexie, { type Table } from 'dexie';
import type { Trace, Span, Log } from '../../shared/parsers/types';

export interface Credentials {
  key: string;
  value: string;
}

export class TelemetryDB extends Dexie {
  traces!: Table<Trace, string>;
  spans!: Table<Span, string>;
  logs!: Table<Log, string>;
  credentials!: Table<Credentials, string>;

  constructor() {
    super('otel-viewer');

    this.version(1).stores({
      traces: 'trace_id, start_time, service_name',
      spans: 'span_id, trace_id, parent_span_id',
      logs: 'log_id, timestamp, trace_id, severity_number',
      credentials: 'key',
    });
  }
}

// Lazy singleton - only created when first accessed in browser
let _db: TelemetryDB | null = null;

export function getDb(): TelemetryDB {
  if (!_db) {
    _db = new TelemetryDB();
  }
  return _db;
}

// For backward compatibility
export const db = {
  get traces() { return getDb().traces; },
  get spans() { return getDb().spans; },
  get logs() { return getDb().logs; },
  get credentials() { return getDb().credentials; },
};
