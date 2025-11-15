// Composable for managing trace data and real-time updates
import type { Ref } from 'vue';
import type {
  Trace,
  WebSocketMessage,
  TraceUpdateData,
  TracesResponse,
} from '@types';

interface UseTracesReturn {
  traces: Ref<Trace[]>;
  clearAllTraces: () => Promise<boolean>;
}

export function useTraces(): UseTracesReturn {
  const traces = ref<Trace[]>([]);
  const { data: wsData } = useWebSocket();

  // Watch for WebSocket messages
  watch(wsData, (newData) => {
    if (!newData) return;

    // Ignore pong messages from heartbeat
    if (newData === 'pong') return;

    try {
      const message = JSON.parse(newData) as WebSocketMessage;

      switch (message.type) {
        case 'connected':
          console.log('[Traces] WebSocket connected:', message.message);
          break;

        case 'trace_update':
          if (message.data) {
            handleTraceUpdate(message.data);
          }
          break;

        case 'clear_data':
          traces.value = [];
          console.log('[Traces] All traces cleared');
          break;
      }
    } catch (error) {
      console.error('[Traces] Error parsing WebSocket message:', error);
    }
  });

  const handleTraceUpdate = (data: TraceUpdateData) => {
    const { trace } = data;

    console.log('[Traces] Received trace update:', trace.trace_id);

    // Check if trace already exists
    const existingIndex = traces.value.findIndex(
      (t) => t.trace_id === trace.trace_id,
    );

    if (existingIndex >= 0) {
      // Update existing trace
      traces.value[existingIndex] = trace;
      console.log('[Traces] Updated existing trace');
    } else {
      // Add new trace to the beginning
      traces.value.unshift(trace);
      console.log('[Traces] Added new trace, total:', traces.value.length);
    }
  };

  const fetchTraces = async (): Promise<Trace[]> => {
    try {
      const response = await $fetch<TracesResponse>('/api/traces');
      traces.value = response.traces;
      console.log('[Traces] Fetched', response.traces.length, 'traces');
      return response.traces;
    } catch (error) {
      console.error('[Traces] Error fetching traces:', error);
      return [];
    }
  };

  const clearAllTraces = async (): Promise<boolean> => {
    try {
      await $fetch('/api/traces/clear', { method: 'POST' });
      traces.value = [];
      console.log('[Traces] All traces cleared');
      return true;
    } catch (error) {
      console.error('[Traces] Error clearing traces:', error);
      return false;
    }
  };

  // Initialize - fetch initial traces
  onMounted(async () => {
    await fetchTraces();
  });

  return {
    traces,
    clearAllTraces,
  };
}
