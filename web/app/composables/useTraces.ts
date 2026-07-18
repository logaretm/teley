// Composable for managing trace data with local-first storage

import type { Trace, Span } from '../../../shared/parsers/types';
import {
  getTraces as dbGetTraces,
  clearTraces as dbClearTraces,
  setTraceCustomName as dbSetTraceCustomName,
  deleteTrace as dbDeleteTrace,
} from '../database/operations';
import {
  onTraceUpdate,
  addServiceNames,
  clearServiceNames,
} from './useDataSync';

interface UseTracesReturn {
  traces: Ref<Trace[]>;
  clearAllTraces: () => Promise<boolean>;
  renameTrace: (traceId: string, customName: string | null) => Promise<void>;
  deleteTrace: (traceId: string) => Promise<void>;
}

export function useTraces(): UseTracesReturn {
  const traces = useState<Trace[]>('traces', () => []);

  // Handle real-time trace updates
  const handleTraceUpdate = (trace: Trace, _spans: Span[]) => {
    console.log('[Traces] Received trace update:', trace.trace_id);

    // Update local state
    const existingIndex = traces.value.findIndex(
      (t) => t.trace_id === trace.trace_id,
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
      addServiceNames(
        result.map((t) => t.service_name),
        'traces',
      );
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
      clearServiceNames('traces');
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

  const renameTrace = async (
    traceId: string,
    customName: string | null,
  ): Promise<void> => {
    const value = customName?.trim() || null;
    await dbSetTraceCustomName(traceId, value);
    const idx = traces.value.findIndex((t) => t.trace_id === traceId);
    if (idx >= 0) {
      traces.value[idx] = {
        ...traces.value[idx]!,
        custom_name: value || undefined,
      };
    }
  };

  const deleteTrace = async (traceId: string): Promise<void> => {
    await dbDeleteTrace(traceId);
    traces.value = traces.value.filter((t) => t.trace_id !== traceId);
  };

  return {
    traces,
    clearAllTraces,
    renameTrace,
    deleteTrace,
  };
}
