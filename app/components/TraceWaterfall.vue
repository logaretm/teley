<template>
  <div class="h-full flex flex-col bg-zinc-950">
    <!-- Header -->
    <div class="bg-zinc-900 border-b border-zinc-800 p-6">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-semibold text-zinc-100">
            {{ trace.operation_name }}
          </h2>
          <div class="flex items-center gap-2">
            <button
              @click="$emit('share')"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <IconPhShareNetworkBold class="w-3.5 h-3.5" />
              {{ shareLabel }}
            </button>
            <button
              @click="$emit('compare')"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <IconPhArrowsLeftRightBold class="w-3.5 h-3.5" />
              Compare
            </button>
          </div>
        </div>
        <div class="flex gap-6 flex-wrap items-center text-sm">
          <span class="text-zinc-400">
            <strong class="text-zinc-200 mr-1">Provider:</strong>

            <span class="inline-flex items-center gap-1">
              {{ getSourceLabel(trace.source) }}
              <SourceIcon :source="trace.source" class="size-4" />
            </span>
          </span>
          <span class="text-zinc-400">
            <strong class="text-zinc-200 mr-1">Service:</strong>
            {{ trace.service_name }}
          </span>
          <span class="text-zinc-400">
            <strong class="text-zinc-200 mr-1">Duration:</strong>
            {{ formatDuration(trace.duration) }}
          </span>
          <span class="text-zinc-400">
            <strong class="text-zinc-200 mr-1">Spans:</strong>
            {{ spans.length }}
          </span>
          <span
            class="px-2 py-1 rounded text-xs font-bold uppercase"
            :class="{
              'bg-green-500/20 text-green-400':
                getStatusColor(trace.status_code) === 'success',
              'bg-red-500/20 text-red-400':
                getStatusColor(trace.status_code) === 'error',
            }"
          >
            {{ getStatusLabel(trace.status_code) }}
          </span>
        </div>
      </div>

      <!-- Error Banner -->
      <div
        v-if="trace.status_code === 2 && trace.status_message"
        class="mt-4 p-3 bg-red-500/10 border-l-2 border-red-500 rounded text-sm text-red-400"
      >
        <strong class="text-red-500 mr-2">Error:</strong>
        {{ trace.status_message }}
      </div>
    </div>

    <!-- Waterfall Content -->
    <div class="flex-1 overflow-y-auto p-4 relative" :style="{ '--name-col': nameColWidth + 'px' }">
      <!-- Column Resize Handle -->
      <div
        class="absolute top-0 bottom-0 z-10 cursor-col-resize -mx-[1.5px] px-[1.5px] border-l border-zinc-800 hover:border-zinc-600 transition-colors"
        :class="{ '!border-zinc-600': nameColDragging }"
        :style="{ left: (nameColWidth + 32) + 'px' }"
        @mousedown="onNameColMouseDown"
      />

      <!-- Time Scale -->
      <div class="grid grid-cols-[var(--name-col)_1fr] gap-4 mb-2">
        <div></div>
        <div
          ref="timeScaleRef"
          class="flex justify-between py-2 pl-2 border-b border-zinc-800"
        >
          <span
            v-for="(label, idx) in timeLabels"
            :key="idx"
            class="text-xs text-zinc-500 font-mono"
          >
            {{ label }}
          </span>
        </div>
      </div>

      <!-- Spans -->
      <div class="space-y-1">
        <div
          v-for="spanRow in spanTree"
          :key="spanRow.span.span_id"
          class="grid grid-cols-[var(--name-col)_1fr] gap-4 hover:bg-zinc-900 cursor-pointer transition-colors py-2 px-2 rounded"
          @click="$emit('selectSpan', spanRow.span)"
        >
          <!-- Span Name -->
          <div class="flex items-center gap-2 min-w-0" :style="{ paddingLeft: `${spanRow.depth * 20}px` }">
            <span v-if="spanRow.depth > 0" class="text-zinc-600 text-xs">
              └─
            </span>
            <span
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase shrink-0"
              :class="
                getDepthColorClassForLabel(
                  spanRow.depth,
                  spanRow.span.status_code,
                )
              "
            >
              {{ getSpanKindLabel(spanRow.span.kind)[0] }}
            </span>
            <span class="text-sm text-zinc-300 truncate">
              {{ spanRow.span.name }}
            </span>
            <span class="text-xs text-zinc-500 font-mono shrink-0 ml-auto">
              {{ formatDuration(spanRow.span.duration) }}
            </span>
          </div>

          <!-- Timeline -->
          <div class="relative h-6 flex items-center">
            <div
              class="absolute h-4 rounded transition-all"
              :class="
                getDepthColorClass(spanRow.depth, spanRow.span.status_code)
              "
              :style="{
                left: `${spanRow.offsetPercent}%`,
                width: `${spanRow.widthPercent}%`,
              }"
            >
              <div class="h-full w-full rounded opacity-80"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { Trace, Span } from '@types';
import {
  formatDuration,
  formatDurationCompact,
  getStatusColor,
  getSpanKindLabel,
} from '~/utils/formatters';
import { useResizeObserver } from '@vueuse/core';
import { buildSpanTree } from '~/utils/span-tree';
import SourceIcon from './SourceIcon.vue';

interface Props {
  trace: Trace;
  spans: Span[];
}

const props = defineProps<Props>();
defineEmits<{
  selectSpan: [span: Span];
  compare: [];
  share: [];
}>();

const { width: nameColWidth, dragging: nameColDragging, onMouseDownLeft: onNameColMouseDown } = useResizablePanel('waterfall-name-col', 250, { min: 150, max: 500 });
const shareLabel = ref('Share');
defineExpose({ setShareLabel: (label: string) => { shareLabel.value = label; } });

const spanTree = computed(() => buildSpanTree(props.spans, props.trace));

// Adaptive time scale labels
const timeScaleRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

useResizeObserver(timeScaleRef, (entries) => {
  const entry = entries[0];
  if (entry) {
    containerWidth.value = entry.contentRect.width;
  }
});

const numLabels = computed(() => {
  const width = containerWidth.value;
  if (width === 0) return 10;
  return Math.min(10, Math.max(2, Math.floor(width / 60)));
});

const timeLabels = computed(() => {
  const duration = props.trace.duration;
  const labels: string[] = [];
  const count = numLabels.value;

  for (let i = 0; i <= count; i++) {
    const time = (duration / count) * i;
    labels.push(formatDurationCompact(time));
  }

  return labels;
});

function getStatusLabel(code: SpanStatusCode): string {
  switch (code) {
    case SpanStatusCode.ERROR:
      return 'ERROR';
    case SpanStatusCode.OK:
    case SpanStatusCode.UNSET:
    default:
      return 'OK';
  }
}

function getSpanKindClass(kind: SpanKind): string {
  const classes: Record<SpanKind, string> = {
    [SpanKind.INTERNAL]: 'internal',
    [SpanKind.SERVER]: 'server',
    [SpanKind.CLIENT]: 'client',
    [SpanKind.PRODUCER]: 'producer',
    [SpanKind.CONSUMER]: 'consumer',
  };
  return classes[kind] || 'internal';
}

function getDepthColorClass(depth: number, statusCode: SpanStatusCode): string {
  // If error, always show red
  if (statusCode === 2) {
    return 'bg-red-500';
  }

  // Color palette for different depth levels
  const depthColors = [
    'bg-blue-500', // Level 0 (root)
    'bg-purple-500', // Level 1
    'bg-emerald-500', // Level 2
    'bg-amber-500', // Level 3
    'bg-cyan-500', // Level 4
    'bg-pink-500', // Level 5
    'bg-lime-500', // Level 6
    'bg-indigo-500', // Level 7
  ];

  // Cycle through colors for deeper levels
  return depthColors[depth % depthColors.length] || 'bg-blue-500';
}

function getDepthColorClassForLabel(
  depth: number,
  statusCode: SpanStatusCode,
): string {
  // If error, always show red
  if (statusCode === 2) {
    return 'bg-red-500/20 text-red-400';
  }

  // Color palette for different depth levels (with opacity for backgrounds and corresponding text colors)
  const depthColors = [
    'bg-blue-500/20 text-blue-400', // Level 0 (root)
    'bg-purple-500/20 text-purple-400', // Level 1
    'bg-emerald-500/20 text-emerald-400', // Level 2
    'bg-amber-500/20 text-amber-400', // Level 3
    'bg-cyan-500/20 text-cyan-400', // Level 4
    'bg-pink-500/20 text-pink-400', // Level 5
    'bg-lime-500/20 text-lime-400', // Level 6
    'bg-indigo-500/20 text-indigo-400', // Level 7
  ];

  // Cycle through colors for deeper levels
  return (
    depthColors[depth % depthColors.length] || 'bg-blue-500/20 text-blue-400'
  );
}
</script>

<style scoped>
@reference '../../app/assets/css/main.css';

.kind-server {
  @apply bg-blue-500/20 text-blue-400;
}

.kind-client {
  @apply bg-purple-500/20 text-purple-400;
}

.kind-internal {
  @apply bg-zinc-600/20 text-zinc-400;
}

.kind-producer {
  @apply bg-green-500/20 text-green-400;
}

.kind-consumer {
  @apply bg-orange-500/20 text-orange-400;
}
</style>
