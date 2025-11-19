export interface Trace {
  trace_id: string;
  service_name: string;
  operation_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status_code: number;
  status_message: string | null;
  created_at: number;
}

export interface Span {
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
  attributes: string; // JSON string
  events: string; // JSON string
  links: string; // JSON string
}

export interface Log {
  log_id: string;
  timestamp: number;
  trace_id: string | null;
  span_id: string | null;
  severity_number: number;
  severity_text: string | null;
  body: string;
  service_name: string;
  attributes: string; // JSON string
  created_at: number;
}

// Initialize database schema
export async function initDatabase() {
  const db = useDatabase();

  await db.sql`
    CREATE TABLE IF NOT EXISTS traces (
      trace_id TEXT PRIMARY KEY,
      service_name TEXT,
      operation_name TEXT,
      start_time INTEGER,
      end_time INTEGER,
      duration INTEGER,
      status_code INTEGER,
      status_message TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_traces_start_time ON traces(start_time DESC)`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_traces_service ON traces(service_name)`;

  await db.sql`
    CREATE TABLE IF NOT EXISTS spans (
      span_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      parent_span_id TEXT,
      name TEXT,
      kind INTEGER,
      start_time INTEGER,
      end_time INTEGER,
      duration INTEGER,
      status_code INTEGER,
      status_message TEXT,
      attributes TEXT,
      events TEXT,
      links TEXT,
      FOREIGN KEY (trace_id) REFERENCES traces(trace_id) ON DELETE CASCADE
    )
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id)`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_spans_parent ON spans(parent_span_id)`;

  await db.sql`
    CREATE TABLE IF NOT EXISTS logs (
      log_id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      trace_id TEXT,
      span_id TEXT,
      severity_number INTEGER NOT NULL,
      severity_text TEXT,
      body TEXT NOT NULL,
      service_name TEXT,
      attributes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON logs(trace_id)`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service_name)`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs(severity_number)`;
}

export async function insertTrace(trace: Omit<Trace, 'created_at'>) {
  try {
    const db = useDatabase();

    await db.sql`
      INSERT OR REPLACE INTO traces (
        trace_id, service_name, operation_name, start_time, end_time, 
        duration, status_code, status_message
      ) VALUES (
        ${trace.trace_id}, 
        ${trace.service_name}, 
        ${trace.operation_name}, 
        ${trace.start_time}, 
        ${trace.end_time}, 
        ${trace.duration}, 
        ${trace.status_code}, 
        ${trace.status_message}
      )
    `;
  } catch (error: any) {
    console.error('[DB] Error inserting trace:', error.message);
    throw error;
  }
}

export async function insertSpan(span: Span) {
  try {
    const db = useDatabase();

    await db.sql`
      INSERT OR REPLACE INTO spans (
        span_id, trace_id, parent_span_id, name, kind, start_time, end_time,
        duration, status_code, status_message, attributes, events, links
      ) VALUES (
        ${span.span_id},
        ${span.trace_id},
        ${span.parent_span_id},
        ${span.name},
        ${span.kind},
        ${span.start_time},
        ${span.end_time},
        ${span.duration},
        ${span.status_code},
        ${span.status_message},
        ${span.attributes},
        ${span.events},
        ${span.links}
      )
    `;
  } catch (error: any) {
    console.error('[DB] Error inserting span:', error.message);
    throw error;
  }
}

export async function getTraces(limit = 100): Promise<Trace[]> {
  const db = useDatabase();

  const { rows } = await db.sql`
    SELECT * FROM traces 
    ORDER BY start_time DESC 
    LIMIT ${limit}
  `;

  return rows as unknown as Trace[];
}

export async function getTrace(traceId: string): Promise<Trace | null> {
  const db = useDatabase();

  const { rows } = await db.sql`
    SELECT * FROM traces WHERE trace_id = ${traceId}
  `;

  if (!rows?.length) {
    return null;
  }

  return rows[0] as unknown as Trace;
}

export async function getSpansByTraceId(traceId: string): Promise<Span[]> {
  const db = useDatabase();

  const { rows } = await db.sql`
    SELECT * FROM spans 
    WHERE trace_id = ${traceId}
    ORDER BY start_time ASC
  `;

  if (!rows?.length) {
    return [];
  }

  return rows as unknown as Span[];
}

export async function clearAllData() {
  const db = useDatabase();

  await db.sql`DELETE FROM spans`;
  await db.sql`DELETE FROM traces`;
  await db.sql`DELETE FROM logs`;
}

export async function insertLog(log: Omit<Log, 'created_at'>) {
  try {
    const db = useDatabase();

    await db.sql`
      INSERT OR REPLACE INTO logs (
        log_id, timestamp, trace_id, span_id, severity_number, 
        severity_text, body, service_name, attributes
      ) VALUES (
        ${log.log_id}, 
        ${log.timestamp}, 
        ${log.trace_id}, 
        ${log.span_id}, 
        ${log.severity_number}, 
        ${log.severity_text}, 
        ${log.body}, 
        ${log.service_name}, 
        ${log.attributes}
      )
    `;
  } catch (error: any) {
    console.error('[DB] Error inserting log:', error.message);
    throw error;
  }
}

export async function getLogs(limit = 500): Promise<Log[]> {
  const db = useDatabase();

  const { rows } = await db.sql`
    SELECT * FROM logs 
    ORDER BY timestamp DESC 
    LIMIT ${limit}
  `;

  return rows as unknown as Log[];
}
