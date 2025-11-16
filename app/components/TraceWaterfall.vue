<template>
  <div class="h-full flex flex-col bg-zinc-950">
    <!-- Header -->
    <div class="bg-zinc-900 border-b border-zinc-800 p-6">
      <div>
        <h2 class="text-xl font-semibold text-zinc-100 mb-3">
          {{ trace.operation_name }}
        </h2>
        <div class="flex gap-6 flex-wrap items-center text-sm">
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
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Time Scale -->
      <div class="grid grid-cols-[250px_1fr] gap-4 mb-2">
        <div></div>
        <div class="flex justify-between py-2 border-b border-zinc-800">
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
          class="grid grid-cols-[250px_1fr] gap-4 hover:bg-zinc-900 cursor-pointer transition-colors py-2 px-2 rounded"
          :style="{ paddingLeft: `${spanRow.depth * 20 + 8}px` }"
          @click="$emit('selectSpan', spanRow.span)"
        >
          <!-- Span Name -->
          <div class="flex items-center gap-2 min-w-0">
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
  getStatusColor,
  getSpanKindLabel,
} from '~/utils/formatters';

interface Props {
  trace: Trace;
  spans: Span[];
}

const props = defineProps<Props>();
defineEmits<{
  selectSpan: [span: Span];
}>();

interface SpanTreeNode {
  span: Span;
  depth: number;
  offsetPercent: number;
  widthPercent: number;
}

// Build hierarchical span tree
const spanTree = computed<SpanTreeNode[]>(() => {
  const spanMap = new Map<string, Span>();
  const children = new Map<string | null, Span[]>();

  // Build maps
  for (const span of props.spans) {
    spanMap.set(span.span_id, span);

    const parentId = span.parent_span_id;
    if (!children.has(parentId)) {
      children.set(parentId, []);
    }
    children.get(parentId)!.push(span);
  }

  // Find root spans (no parent or parent not in this trace)
  const rootSpans = props.spans.filter((span) => {
    return !span.parent_span_id || !spanMap.has(span.parent_span_id);
  });

  // Sort by start time
  rootSpans.sort((a, b) => a.start_time - b.start_time);

  const result: SpanTreeNode[] = [];
  const traceStart = props.trace.start_time;
  const traceDuration = props.trace.duration;

  function traverse(span: Span, depth: number) {
    const offsetPercent =
      ((span.start_time - traceStart) / traceDuration) * 100;
    const widthPercent = (span.duration / traceDuration) * 100;

    result.push({
      span,
      depth,
      offsetPercent: Math.max(0, offsetPercent),
      widthPercent: Math.max(0.5, widthPercent), // Minimum width for visibility
    });

    // Process children
    const childSpans = children.get(span.span_id) || [];
    childSpans.sort((a, b) => a.start_time - b.start_time);

    for (const child of childSpans) {
      traverse(child, depth + 1);
    }
  }

  for (const rootSpan of rootSpans) {
    traverse(rootSpan, 0);
  }

  return result;
});

// Generate time scale labels
const timeLabels = computed(() => {
  const duration = props.trace.duration;
  const labels: string[] = [];
  const numLabels = 10;

  for (let i = 0; i <= numLabels; i++) {
    const time = (duration / numLabels) * i;
    labels.push(formatDuration(time));
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
