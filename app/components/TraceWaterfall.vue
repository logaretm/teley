<template>
  <div class="trace-waterfall">
    <div class="waterfall-header">
      <div class="trace-info">
        <h2>{{ trace.operation_name }}</h2>
        <div class="trace-meta">
          <span class="meta-item">
            <strong>Service:</strong> {{ trace.service_name }}
          </span>
          <span class="meta-item">
            <strong>Duration:</strong> {{ formatDuration(trace.duration) }}
          </span>
          <span class="meta-item">
            <strong>Spans:</strong> {{ spans.length }}
          </span>
          <span
            class="meta-item status-badge"
            :class="`status-${getStatusColor(trace.status_code)}`"
          >
            {{ getStatusLabel(trace.status_code) }}
          </span>
        </div>
      </div>

      <div
        v-if="trace.status_code === 2 && trace.status_message"
        class="error-banner"
      >
        <strong>Error:</strong> {{ trace.status_message }}
      </div>
    </div>

    <div class="waterfall-content">
      <!-- Time scale -->
      <div class="time-scale">
        <div class="time-scale-left-spacer"></div>
        <div class="time-scale-labels">
          <span
            v-for="(label, idx) in timeLabels"
            :key="idx"
            class="time-label"
          >
            {{ label }}
          </span>
        </div>
      </div>

      <!-- Spans -->
      <div class="spans-container">
        <div
          v-for="spanRow in spanTree"
          :key="spanRow.span.span_id"
          class="span-row"
          :style="{ paddingLeft: `${spanRow.depth * 20}px` }"
          @click="$emit('selectSpan', spanRow.span)"
        >
          <div class="span-name">
            <span v-if="spanRow.depth > 0" class="span-indent">└─</span>
            <span
              class="span-kind-badge"
              :class="`kind-${getSpanKindClass(spanRow.span.kind)}`"
            >
              {{ getSpanKindLabel(spanRow.span.kind) }}
            </span>
            <span class="span-text">{{ spanRow.span.name }}</span>
            <span class="span-duration-text">{{
              formatDuration(spanRow.span.duration)
            }}</span>
          </div>

          <div class="span-timeline">
            <div
              class="span-bar"
              :class="{ error: spanRow.span.status_code === 2 }"
              :style="{
                left: `${spanRow.offsetPercent}%`,
                width: `${spanRow.widthPercent}%`,
              }"
            >
              <div class="span-bar-inner"></div>
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
      return 'OK';
    default:
      return 'UNSET';
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
</script>

<style scoped>
.trace-waterfall {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #09090b;
}

.waterfall-header {
  background: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 1.5rem;
}

.trace-info h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 0.75rem;
}

.trace-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.875rem;
}

.meta-item {
  color: #a1a1aa;
}

.meta-item strong {
  color: #e4e4e7;
  margin-right: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-badge.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.status-error {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.status-badge.status-default {
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
}

.error-banner {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(220, 38, 38, 0.1);
  border-left: 3px solid #dc2626;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #fca5a5;
}

.error-banner strong {
  color: #dc2626;
  margin-right: 0.5rem;
}

.waterfall-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.time-scale {
  margin-bottom: 0.5rem;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1rem;
}

.time-scale-left-spacer {
  /* Empty spacer to align with span names */
}

.time-scale-labels {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #27272a;
}

.time-label {
  font-size: 0.75rem;
  color: #71717a;
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}

.spans-container {
  margin-top: 1rem;
}

.span-row {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.span-row:hover {
  background: #18181b;
}

.span-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  overflow: hidden;
}

.span-indent {
  color: #52525b;
  font-family: monospace;
  flex-shrink: 0;
}

.span-kind-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.span-kind-badge.kind-server {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.span-kind-badge.kind-client {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.span-kind-badge.kind-internal {
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
}

.span-kind-badge.kind-producer {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.span-kind-badge.kind-consumer {
  background: rgba(251, 146, 60, 0.1);
  color: #fb923c;
}

.span-text {
  color: #e4e4e7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.span-duration-text {
  color: #71717a;
  font-size: 0.75rem;
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  flex-shrink: 0;
}

.span-timeline {
  position: relative;
  height: 24px;
  background: #18181b;
  border-radius: 0.25rem;
}

.span-bar {
  position: absolute;
  height: 100%;
  border-radius: 0.25rem;
  overflow: hidden;
  transition: transform 0.15s;
}

.span-row:hover .span-bar {
  transform: scaleY(1.1);
}

.span-bar.error {
  background: linear-gradient(90deg, #dc2626, #b91c1c);
}

.span-bar:not(.error) {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.span-bar-inner {
  height: 100%;
  width: 100%;
  opacity: 0.8;
}

.span-row:hover .span-bar-inner {
  opacity: 1;
}
</style>
