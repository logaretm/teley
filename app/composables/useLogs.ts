// Composable for managing log data with local-first storage

import type { Log } from '../../shared/parsers/types';
import {
  getLogs as dbGetLogs,
  clearLogs as dbClearLogs,
} from '../database/operations';
import { onLogUpdate } from './useDataSync';

export function useLogs() {
  const logs = useState<Log[]>('logs', () => []);
  const loading = useState<boolean>('logs-loading', () => false);
  const error = useState<string | null>('logs-error', () => null);

  const { liveMode } = useLiveMode();

  // Handle real-time log updates
  const handleLogUpdate = (log: Log) => {
    if (!liveMode.value) return;

    console.log('[Logs] Received log update:', log.log_id);

    // Update local state - prepend to beginning (newest first)
    logs.value = [log, ...logs.value];

    // Keep only the last 500 logs
    if (logs.value.length > 500) {
      logs.value = logs.value.slice(0, 500);
    }
  };

  // Fetch all logs from IndexedDB
  async function fetchLogs() {
    loading.value = true;
    error.value = null;

    try {
      const result = await dbGetLogs(500);
      logs.value = result;
      console.log('[Logs] Loaded', result.length, 'logs from IndexedDB');
    } catch (err: any) {
      console.error('[Logs] Error fetching logs:', err);
      error.value = err.message || 'Failed to fetch logs';
    } finally {
      loading.value = false;
    }
  }

  // Clear all logs
  async function clearLogs() {
    try {
      await dbClearLogs();
      logs.value = [];
      console.log('[Logs] All logs cleared');
    } catch (err: any) {
      console.error('[Logs] Error clearing logs:', err);
    }
  }

  // Initialize
  onMounted(() => {
    // Subscribe to real-time log updates
    const unsubscribe = onLogUpdate(handleLogUpdate);

    // Load existing logs from IndexedDB
    fetchLogs();

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribe();
    });
  });

  return {
    logs: readonly(logs),
    loading: readonly(loading),
    error: readonly(error),
    fetchLogs,
    clearLogs,
  };
}
