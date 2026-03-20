<template>
  <div class="flex-1 flex overflow-hidden bg-zinc-950">
    <!-- Left panel: metric list -->
    <aside class="bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0" :style="{ width: metricsPanelWidth + 'px' }">
      <!-- Header -->
      <div class="border-b border-zinc-800 px-4 py-3">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-zinc-100 inline-flex items-baseline gap-1.5">
            Metrics
            <button
              @click="setupGuideDialog?.open()"
              class="hover:text-zinc-300 text-zinc-500 transition-colors translate-y-0.5"
              title="Setup guide"
            >
              <IconPhQuestion class="w-4 h-4" />
            </button>
          </h2>
          <span class="text-xs text-zinc-500">{{ groupedMetrics.length }} metric{{ groupedMetrics.length === 1 ? '' : 's' }}</span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">
          Real-time metrics (last 1000 data points)
        </p>

        <!-- Search -->
        <div class="mt-2 relative">
          <IconPhMagnifyingGlass class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter metrics..."
            class="w-full bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>
      </div>

      <!-- Metric cards -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2" style="scrollbar-gutter: stable">
        <div v-if="loading" class="flex items-center justify-center h-32">
          <div class="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="filteredGroupedMetrics.length === 0" class="flex items-center justify-center h-32">
          <p class="text-sm text-zinc-500">
            {{ searchQuery ? 'No matching metrics' : 'No metrics yet' }}
          </p>
        </div>

        <MetricCard
          v-for="group in filteredGroupedMetrics"
          :key="group.name"
          :name="group.name"
          :type="group.type"
          :description="group.description"
          :unit="group.unit"
          :latest-value="group.latestValue"
          :data-point-count="group.dataPoints.length"
          :sparkline-points="group.sparklineValues"
          :source="group.source"
          :selected="selectedMetricName === group.name"
          @select="selectedMetricName = group.name"
        />
      </div>
    </aside>

    <!-- Resize handle -->
    <div
      class="w-0 cursor-col-resize border-l border-zinc-800 hover:border-zinc-600 transition-colors shrink-0 -mx-[1.5px] px-[1.5px] z-10"
      :class="{ 'border-zinc-600': metricsPanelDragging }"
      @mousedown="onMetricsPanelMouseDown"
    />

    <!-- Right panel: metric detail / chart -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <template v-if="selectedGroup">
        <div class="border-b border-zinc-800 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-zinc-100">{{ selectedGroup.name }}</h3>
              <p v-if="selectedGroup.description" class="text-sm text-zinc-400 mt-0.5">
                {{ selectedGroup.description }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="px-2 py-1 text-xs font-medium rounded uppercase"
                :class="selectedTypeBadgeClass"
              >
                {{ selectedGroup.type }}
              </span>
              <span v-if="selectedGroup.unit" class="text-sm text-zinc-400">
                Unit: {{ selectedGroup.unit }}
              </span>
            </div>
          </div>

          <!-- Stats row -->
          <div class="flex gap-6 mt-4">
            <div>
              <span class="text-xs text-zinc-500 block">Latest</span>
              <span class="text-sm font-medium text-zinc-100 tabular-nums">
                {{ selectedGroup.latestValue ?? '-' }}
              </span>
            </div>
            <div v-if="selectedGroup.type !== 'set'">
              <span class="text-xs text-zinc-500 block">Min</span>
              <span class="text-sm font-medium text-zinc-100 tabular-nums">
                {{ selectedStats.min }}
              </span>
            </div>
            <div v-if="selectedGroup.type !== 'set'">
              <span class="text-xs text-zinc-500 block">Max</span>
              <span class="text-sm font-medium text-zinc-100 tabular-nums">
                {{ selectedStats.max }}
              </span>
            </div>
            <div v-if="selectedGroup.type !== 'set'">
              <span class="text-xs text-zinc-500 block">Avg</span>
              <span class="text-sm font-medium text-zinc-100 tabular-nums">
                {{ selectedStats.avg }}
              </span>
            </div>
            <div>
              <span class="text-xs text-zinc-500 block">Data Points</span>
              <span class="text-sm font-medium text-zinc-100 tabular-nums">
                {{ selectedGroup.dataPoints.length }}
              </span>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="flex-1 p-6 overflow-auto">
          <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <MetricChart
              :data-points="selectedChartData"
              :type="selectedGroup.type"
              :height="300"
              :unit="selectedGroup.unit"
            />
          </div>

          <!-- Data points table -->
          <div class="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 border-b border-zinc-800">
              <h4 class="text-sm font-medium text-zinc-300">Recent Data Points</h4>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-zinc-900">
                  <tr class="border-b border-zinc-800">
                    <th class="text-left px-4 py-2 text-xs font-medium text-zinc-500">Time</th>
                    <th class="text-left px-4 py-2 text-xs font-medium text-zinc-500">Value</th>
                    <th class="text-left px-4 py-2 text-xs font-medium text-zinc-500">Service</th>
                    <th class="text-left px-4 py-2 text-xs font-medium text-zinc-500">Attributes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="dp in selectedGroup.dataPoints.slice(0, 50)"
                    :key="dp.metric_id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td class="px-4 py-1.5 text-zinc-400 tabular-nums whitespace-nowrap">
                      {{ formatTimestamp(dp.timestamp) }}
                    </td>
                    <td class="px-4 py-1.5 text-zinc-100 tabular-nums">
                      <template v-if="dp.type === 'histogram' && dp.histogram">
                        count={{ dp.histogram.count }}, sum={{ formatNumber(dp.histogram.sum) }}, min={{ formatNumber(dp.histogram.min) }}, max={{ formatNumber(dp.histogram.max) }}
                      </template>
                      <template v-else-if="dp.type === 'set' && dp.set_values">
                        {{ dp.set_values.length }} unique
                      </template>
                      <template v-else>
                        {{ dp.value ?? '-' }}
                      </template>
                    </td>
                    <td class="px-4 py-1.5 text-zinc-400">{{ dp.service_name }}</td>
                    <td class="px-4 py-1.5 text-zinc-500 text-xs max-w-xs truncate">
                      {{ Object.keys(dp.attributes).length ? JSON.stringify(dp.attributes) : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-6 max-w-md px-8">
          <div
            class="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950"
            />
            <IconPhGauge class="w-16 h-16 text-zinc-700 relative z-10" />
          </div>
          <div class="space-y-3">
            <h3 class="text-xl font-semibold text-zinc-300">
              {{ groupedMetrics.length > 0 ? 'Select a metric' : 'No metrics yet' }}
            </h3>
            <p class="text-sm text-zinc-500 leading-relaxed">
              {{
                groupedMetrics.length > 0
                  ? 'Choose a metric from the sidebar to view its time-series data'
                  : 'Metrics will appear here as they are received via OTLP or Sentry'
              }}
            </p>
          </div>
          <button
            v-if="groupedMetrics.length === 0"
            @click="setupGuideDialog?.open()"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <IconPhBookOpenText class="w-4 h-4" />
            Setup Guide
          </button>
        </div>
      </div>
    </div>

    <!-- Setup Guide Modal -->
    <ModalDialog ref="setupGuideDialog" title="Metrics Setup Guide" size="large">
      <MetricsSetupGuide />
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import type { Metric, MetricType, TraceSource } from '../../shared/parsers/types';

const { metrics, loading } = useMetrics();
const { selectedServices, hasMultipleServices } = useServiceFilter();

const { width: metricsPanelWidth, dragging: metricsPanelDragging, onMouseDownLeft: onMetricsPanelMouseDown } = useResizablePanel('metrics-panel-width', 340);
const searchQuery = ref('');
const selectedMetricName = ref<string | null>(null);
const setupGuideDialog = ref<{ open: () => void; close: () => void } | null>(null);

interface MetricGroup {
  name: string;
  type: MetricType;
  description: string | null;
  unit: string | null;
  source: TraceSource;
  latestValue: number | null;
  sparklineValues: number[];
  dataPoints: Metric[];
}

const filteredMetrics = computed(() => {
  let result = metrics.value;
  if (hasMultipleServices.value) {
    result = result.filter(m => selectedServices.value.has(m.service_name));
  }
  return result;
});

const groupedMetrics = computed<MetricGroup[]>(() => {
  const groups = new Map<string, Metric[]>();

  for (const metric of filteredMetrics.value) {
    const existing = groups.get(metric.name);
    if (existing) {
      existing.push(metric);
    } else {
      groups.set(metric.name, [metric]);
    }
  }

  const result: MetricGroup[] = [];
  for (const [name, dataPoints] of groups) {
    const sorted = [...dataPoints].sort((a, b) => b.timestamp - a.timestamp);
    const latest = sorted[0]!;
    const chronological = [...sorted].reverse();

    const sparklineValues = chronological
      .filter(dp => dp.value !== null)
      .map(dp => dp.value!);

    result.push({
      name,
      type: latest.type,
      description: latest.description,
      unit: latest.unit,
      source: latest.source,
      latestValue: latest.value,
      sparklineValues,
      dataPoints: sorted,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
});

const filteredGroupedMetrics = computed(() => {
  if (!searchQuery.value) return groupedMetrics.value;
  const q = searchQuery.value.toLowerCase();
  return groupedMetrics.value.filter(g => g.name.toLowerCase().includes(q));
});

const selectedGroup = computed(() => {
  if (!selectedMetricName.value) return null;
  return groupedMetrics.value.find(g => g.name === selectedMetricName.value) ?? null;
});

const selectedChartData = computed(() => {
  if (!selectedGroup.value) return [];
  const points = [...selectedGroup.value.dataPoints].reverse();

  if (selectedGroup.value.type === 'histogram') {
    return points
      .filter(dp => dp.histogram)
      .map(dp => ({
        x: dp.timestamp,
        y: dp.histogram!.sum / (dp.histogram!.count || 1),
      }));
  }

  return points
    .filter(dp => dp.value !== null)
    .map(dp => ({
      x: dp.timestamp,
      y: dp.value!,
    }));
});

const selectedStats = computed(() => {
  if (!selectedGroup.value) return { min: '-', max: '-', avg: '-' };

  const values = selectedGroup.value.dataPoints
    .map(dp => {
      if (dp.type === 'histogram' && dp.histogram) {
        return dp.histogram.sum / (dp.histogram.count || 1);
      }
      return dp.value;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) return { min: '-', max: '-', avg: '-' };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    min: formatNumber(min),
    max: formatNumber(max),
    avg: formatNumber(avg),
  };
});

const selectedTypeBadgeClass = computed(() => {
  switch (selectedGroup.value?.type) {
    case 'counter': return 'bg-green-500/20 text-green-400';
    case 'gauge': return 'bg-blue-500/20 text-blue-400';
    case 'histogram': return 'bg-amber-500/20 text-amber-400';
    case 'set': return 'bg-violet-500/20 text-violet-400';
    default: return 'bg-zinc-500/20 text-zinc-400';
  }
});

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
</script>
