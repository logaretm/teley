<template>
  <div class="trace-list">
    <div class="trace-list-header">
      <h2>Traces</h2>
      <span class="trace-count">{{ traces.length }}</span>
    </div>

    <div v-if="traces.length === 0" class="empty-traces">
      <p>No traces yet</p>
      <p class="hint">Waiting for traces from instrumented applications...</p>
    </div>

    <div v-else class="trace-items">
      <div
        v-for="trace in traces"
        :key="trace.trace_id"
        class="trace-item"
        :class="{
          selected: selectedTraceId === trace.trace_id,
          error: trace.status_code === 2,
        }"
        @click="$emit('select', trace.trace_id)"
      >
        <div class="trace-item-header">
          <span class="trace-operation">{{ trace.operation_name }}</span>
          <span
            class="trace-status"
            :class="`status-${getStatusColor(trace.status_code)}`"
          >
            {{ getStatusLabel(trace.status_code) }}
          </span>
        </div>

        <div class="trace-item-meta">
          <span class="trace-service">{{ trace.service_name }}</span>
          <span class="trace-duration">{{
            formatDuration(trace.duration)
          }}</span>
        </div>

        <div class="trace-item-time">
          {{ formatTimestamp(trace.start_time) }}
        </div>

        <div
          v-if="trace.status_code === 2 && trace.status_message"
          class="trace-error-msg"
        >
          {{ trace.status_message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api';
import type { Trace } from '@types';

interface Props {
  traces: Trace[];
  selectedTraceId: string | null;
}

defineProps<Props>();
defineEmits<{
  select: [traceId: string];
}>();

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
</script>

<style scoped>
.trace-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.trace-list-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trace-list-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #fafafa;
}

.trace-count {
  font-size: 0.75rem;
  color: #71717a;
  background: #27272a;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.empty-traces {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #71717a;
}

.empty-traces p {
  margin: 0.25rem 0;
}

.empty-traces .hint {
  font-size: 0.875rem;
  color: #52525b;
}

.trace-items {
  flex: 1;
  overflow-y: auto;
}

.trace-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #27272a;
  cursor: pointer;
  transition: background 0.15s;
}

.trace-item:hover {
  background: #1c1c1f;
}

.trace-item.selected {
  background: #1e293b;
  border-left: 3px solid #3b82f6;
}

.trace-item.error {
  border-left: 3px solid #dc2626;
}

.trace-item.error.selected {
  background: #1e1a1a;
}

.trace-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.trace-operation {
  font-weight: 500;
  color: #fafafa;
  font-size: 0.875rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trace-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  text-transform: uppercase;
}

.trace-status.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.trace-status.status-error {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.trace-status.status-default {
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
}

.trace-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.trace-service {
  color: #a1a1aa;
}

.trace-duration {
  color: #71717a;
  font-weight: 500;
}

.trace-item-time {
  font-size: 0.75rem;
  color: #52525b;
}

.trace-error-msg {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(220, 38, 38, 0.05);
  border-left: 2px solid #dc2626;
  font-size: 0.75rem;
  color: #fca5a5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
