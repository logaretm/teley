import type {
  Log,
  LogsResponse,
  WebSocketMessage,
  LogUpdateData,
} from '@types';

export function useLogs() {
  const logs = useState<Log[]>('logs', () => []);
  const loading = useState<boolean>('logs-loading', () => false);
  const error = useState<string | null>('logs-error', () => null);

  const { data: wsData } = useWebSocket();
  const { liveMode } = useLiveMode();

  // Watch for WebSocket messages
  watch(wsData, (newData) => {
    if (!newData || !liveMode.value) return;

    // Ignore pong messages from heartbeat
    if (newData === 'pong') return;

    try {
      const message = JSON.parse(newData) as WebSocketMessage;

      switch (message.type) {
        case 'log_update':
          if (message.data) {
            handleLogUpdate(message.data as LogUpdateData);
          }
          break;

        case 'clear_data':
          logs.value = [];
          console.log('[Logs] All logs cleared');
          break;
      }
    } catch (err) {
      console.error('[Logs] Error parsing WebSocket message:', err);
    }
  });

  const handleLogUpdate = (data: LogUpdateData) => {
    const { log } = data;
    console.log('[Logs] Received log update:', log.log_id);
    addLog(log);
  };

  // Fetch all logs
  async function fetchLogs() {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<LogsResponse>('/api/logs');
      logs.value = response.logs;
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      error.value = err.message || 'Failed to fetch logs';
    } finally {
      loading.value = false;
    }
  }

  // Add a new log (from WebSocket)
  function addLog(log: Log) {
    // Prepend to the beginning (newest first)
    logs.value = [log, ...logs.value];

    // Keep only the last 500 logs
    if (logs.value.length > 500) {
      logs.value = logs.value.slice(0, 500);
    }
  }

  // Clear all logs
  async function clearLogs() {
    try {
      await $fetch('/api/logs/clear', { method: 'POST' });
      logs.value = [];
      console.log('[Logs] All logs cleared');
    } catch (err: any) {
      console.error('[Logs] Error clearing logs:', err);
    }
  }

  return {
    logs: readonly(logs),
    loading: readonly(loading),
    error: readonly(error),
    fetchLogs,
    addLog,
    clearLogs,
  };
}
