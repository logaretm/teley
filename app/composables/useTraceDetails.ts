import type { Trace, Span, TraceDetailsResponse } from '@types';

export function useTraceDetails(traceId: MaybeRefOrGetter<string>) {
  const trace = ref<Trace | null>(null);
  const spans = ref<Span[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchDetails = async () => {
    const id = toValue(traceId);
    if (!id) {
      trace.value = null;
      spans.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<TraceDetailsResponse>(`/api/traces/${id}`);
      if (data) {
        trace.value = data.trace;
        spans.value = data.spans;
      }
    } catch (err) {
      console.error('Error fetching trace details:', err);
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  // Fetch when traceId changes
  watch(() => toValue(traceId), fetchDetails, { immediate: true });

  return {
    trace,
    spans,
    loading,
    error,
    refetch: fetchDetails,
  };
}
