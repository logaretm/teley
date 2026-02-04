// Composable for syncing incoming telemetry data to IndexedDB
// This should be called once at the app level to ensure data is always captured

import type { Trace, Span, Log, WebSocketMessage } from '../../shared/parsers/types';
import {
  upsertTrace,
  upsertSpans,
  upsertLog,
} from '../database/operations';

// Event bus for notifying components of new data
const traceListeners = new Set<(trace: Trace, spans: Span[]) => void>();
const logListeners = new Set<(log: Log) => void>();

export function useDataSync() {
  const { onData } = useRelay();

  const initialize = () => {
    // Register for all incoming data from relay
    onData(handleMessage);
  };

  const handleMessage = async (message: WebSocketMessage) => {
    console.log('[DataSync] handleMessage:', message.type, message);

    switch (message.type) {
      case 'trace_update':
        if (message.data) {
          await handleTraceUpdate(message.data.trace, message.data.spans);
        }
        break;

      case 'log_update':
        if (message.data) {
          await handleLogUpdate(message.data.log);
        }
        break;

      case 'clear_data':
        console.log('[DataSync] Clear data received');
        break;

      default:
        console.log('[DataSync] Unknown message type:', message.type);
    }
  };

  const handleTraceUpdate = async (trace: Trace, spans: Span[]) => {
    console.log('[DataSync] Received trace:', trace.trace_id);

    // Save to IndexedDB
    await upsertTrace(trace);
    await upsertSpans(spans);

    // Notify listeners
    for (const listener of traceListeners) {
      try {
        listener(trace, spans);
      } catch (err) {
        console.error('[DataSync] Error in trace listener:', err);
      }
    }
  };

  const handleLogUpdate = async (log: Log) => {
    console.log('[DataSync] Received log:', log.log_id);

    // Save to IndexedDB
    await upsertLog(log);

    // Notify listeners
    for (const listener of logListeners) {
      try {
        listener(log);
      } catch (err) {
        console.error('[DataSync] Error in log listener:', err);
      }
    }
  };

  return {
    initialize,
  };
}

// Subscribe to trace updates (for real-time UI updates)
export function onTraceUpdate(callback: (trace: Trace, spans: Span[]) => void): () => void {
  traceListeners.add(callback);
  return () => traceListeners.delete(callback);
}

// Subscribe to log updates (for real-time UI updates)
export function onLogUpdate(callback: (log: Log) => void): () => void {
  logListeners.add(callback);
  return () => logListeners.delete(callback);
}
