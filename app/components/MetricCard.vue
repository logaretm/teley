<template>
  <div
    class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors cursor-pointer"
    :class="{ 'ring-1 ring-blue-500/50 border-blue-500/30': selected }"
    @click="$emit('select')"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-medium text-zinc-100 truncate">{{ name }}</h3>
        <p v-if="description" class="text-xs text-zinc-500 mt-0.5 truncate">
          {{ description }}
        </p>
      </div>
      <div class="flex items-center gap-2 ml-3 shrink-0">
        <span
          class="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
          :class="typeBadgeClass"
        >
          {{ type }}
        </span>
        <span
          v-if="source === 'SENTRY'"
          class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400"
        >
          SENTRY
        </span>
      </div>
    </div>

    <div class="flex items-end justify-between">
      <div>
        <span class="text-2xl font-semibold text-zinc-100 tabular-nums">
          {{ formattedValue }}
        </span>
        <span v-if="unit" class="text-xs text-zinc-500 ml-1">{{ unit }}</span>
      </div>
      <div class="text-xs text-zinc-500">
        {{ dataPointCount }} point{{ dataPointCount === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="sparklinePoints.length > 1" class="mt-3 h-8">
      <svg class="w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${sparklinePoints.length - 1} 1`">
        <polyline
          :points="sparklinePath"
          fill="none"
          stroke="#3b82f6"
          stroke-width="0.05"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MetricType, TraceSource } from '../../shared/parsers/types';

const props = defineProps<{
  name: string;
  type: MetricType;
  description?: string | null;
  unit?: string | null;
  latestValue: number | null;
  dataPointCount: number;
  sparklinePoints: number[];
  source: TraceSource;
  selected?: boolean;
}>();

defineEmits<{
  select: [];
}>();

const typeBadgeClass = computed(() => {
  switch (props.type) {
    case 'counter':
      return 'bg-green-500/20 text-green-400';
    case 'gauge':
      return 'bg-blue-500/20 text-blue-400';
    case 'histogram':
      return 'bg-amber-500/20 text-amber-400';
    case 'set':
      return 'bg-violet-500/20 text-violet-400';
    default:
      return 'bg-zinc-500/20 text-zinc-400';
  }
});

const formattedValue = computed(() => {
  if (props.latestValue === null) return '-';
  if (props.type === 'histogram') return '-';
  if (Number.isInteger(props.latestValue)) return props.latestValue.toLocaleString();
  return props.latestValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
});

const sparklinePath = computed(() => {
  const points = props.sparklinePoints;
  if (points.length < 2) return '';

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((v, i) => `${i},${1 - (v - min) / range}`)
    .join(' ');
});
</script>
