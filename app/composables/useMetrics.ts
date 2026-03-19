// Composable for managing metric data with local-first storage

import type { Metric } from '../../shared/parsers/types';
import {
  getMetrics as dbGetMetrics,
  clearMetrics as dbClearMetrics,
} from '../database/operations';
import { onMetricUpdate, addServiceNames, clearServiceNames } from './useDataSync';

export function useMetrics() {
  const metrics = useState<Metric[]>('metrics', () => []);
  const loading = useState<boolean>('metrics-loading', () => false);
  const error = useState<string | null>('metrics-error', () => null);

  const handleMetricUpdate = (metric: Metric) => {
    console.log('[Metrics] Received metric update:', metric.metric_id);

    metrics.value = [metric, ...metrics.value];

    // Keep only the last 1000 metrics
    if (metrics.value.length > 1000) {
      metrics.value = metrics.value.slice(0, 1000);
    }
  };

  async function fetchMetrics() {
    loading.value = true;
    error.value = null;

    try {
      const result = await dbGetMetrics(1000);
      metrics.value = result;
      addServiceNames(result.map(m => m.service_name), 'metrics');
      console.log('[Metrics] Loaded', result.length, 'metrics from IndexedDB');
    } catch (err: any) {
      console.error('[Metrics] Error fetching metrics:', err);
      error.value = err.message || 'Failed to fetch metrics';
    } finally {
      loading.value = false;
    }
  }

  async function clearMetrics() {
    try {
      await dbClearMetrics();
      metrics.value = [];
      clearServiceNames('metrics');
      console.log('[Metrics] All metrics cleared');
    } catch (err: any) {
      console.error('[Metrics] Error clearing metrics:', err);
    }
  }

  onMounted(() => {
    const unsubscribe = onMetricUpdate(handleMetricUpdate);
    fetchMetrics();

    onUnmounted(() => {
      unsubscribe();
    });
  });

  return {
    metrics: readonly(metrics),
    loading: readonly(loading),
    error: readonly(error),
    fetchMetrics,
    clearMetrics,
  };
}
