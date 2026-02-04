// Composable for managing trace data with local-first storage

import type { Trace, Span } from '../../shared/parsers/types';
import {
  getTraces as dbGetTraces,
  clearTraces as dbClearTraces,
} from '../database/operations';
import { onTraceUpdate } from './useDataSync';

interface UseTracesReturn {
  traces: Ref<Trace[]>;
  clearAllTraces: () => Promise<boolean>;
}

export function useTraces(): UseTracesReturn {
  const traces = ref<Trace[]>([]);
  const { liveMode } = useLiveMode();

  // Handle real-time trace updates
  const handleTraceUpdate = (trace: Trace, spans: Span[]) => {
    if (!liveMode.value) return;

    console.log('[Traces] Received trace update:', trace.trace_id);

    // Update local state
    const existingIndex = traces.value.findIndex(
      (t) => t.trace_id === trace.trace_id
    );

    if (existingIndex >= 0) {
      traces.value[existingIndex] = trace;
      console.log('[Traces] Updated existing trace');
    } else {
      traces.value.unshift(trace);
      console.log('[Traces] Added new trace, total:', traces.value.length);
    }
  };

  const fetchTraces = async (): Promise<Trace[]> => {
    try {
      const result = await dbGetTraces(100);
      traces.value = result;
      console.log('[Traces] Loaded', result.length, 'traces from IndexedDB');
      return result;
    } catch (error) {
      console.error('[Traces] Error fetching traces:', error);
      return [];
    }
  };

  const clearAllTraces = async (): Promise<boolean> => {
    try {
      await dbClearTraces();
      traces.value = [];
      console.log('[Traces] All traces cleared');
      return true;
    } catch (error) {
      console.error('[Traces] Error clearing traces:', error);
      return false;
    }
  };

  // Initialize
  onMounted(() => {
    // Subscribe to real-time trace updates
    const unsubscribe = onTraceUpdate(handleTraceUpdate);

    // Load existing traces from IndexedDB
    fetchTraces();

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribe();
    });
  });

  return {
    traces,
    clearAllTraces,
  };
}
