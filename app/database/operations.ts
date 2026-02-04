// Database operations for client-side storage

import { db } from './index';
import type { Trace, Span, Log } from '../../shared/parsers/types';

// Trace operations
export async function upsertTrace(trace: Trace): Promise<void> {
  await db.traces.put(trace);
}

export async function upsertTraces(traces: Trace[]): Promise<void> {
  await db.traces.bulkPut(traces);
}

export async function getTraces(limit = 100): Promise<Trace[]> {
  return db.traces.orderBy('start_time').reverse().limit(limit).toArray();
}

export async function getTrace(traceId: string): Promise<Trace | undefined> {
  return db.traces.get(traceId);
}

export async function clearTraces(): Promise<void> {
  await db.traces.clear();
  await db.spans.clear();
}

// Span operations
export async function upsertSpan(span: Span): Promise<void> {
  await db.spans.put(span);
}

export async function upsertSpans(spans: Span[]): Promise<void> {
  await db.spans.bulkPut(spans);
}

export async function getSpansByTraceId(traceId: string): Promise<Span[]> {
  return db.spans.where('trace_id').equals(traceId).sortBy('start_time');
}

// Log operations
export async function insertLog(log: Log): Promise<void> {
  await db.logs.add(log);
}

export async function upsertLog(log: Log): Promise<void> {
  await db.logs.put(log);
}

export async function getLogs(limit = 500): Promise<Log[]> {
  return db.logs.orderBy('timestamp').reverse().limit(limit).toArray();
}

export async function clearLogs(): Promise<void> {
  await db.logs.clear();
}

// Combined trace + spans
export async function getTraceWithSpans(traceId: string): Promise<{ trace: Trace | undefined; spans: Span[] }> {
  const [trace, spans] = await Promise.all([
    getTrace(traceId),
    getSpansByTraceId(traceId),
  ]);
  return { trace, spans };
}

// Credentials operations
export async function saveCredentials(roomId: string, receiveToken: string): Promise<void> {
  await db.credentials.bulkPut([
    { key: 'roomId', value: roomId },
    { key: 'receiveToken', value: receiveToken },
  ]);
}

export async function getCredentials(): Promise<{ roomId: string | null; receiveToken: string | null }> {
  const [roomIdRecord, tokenRecord] = await Promise.all([
    db.credentials.get('roomId'),
    db.credentials.get('receiveToken'),
  ]);

  return {
    roomId: roomIdRecord?.value ?? null,
    receiveToken: tokenRecord?.value ?? null,
  };
}

export async function clearCredentials(): Promise<void> {
  await db.credentials.clear();
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.traces.clear(),
    db.spans.clear(),
    db.logs.clear(),
  ]);
}
