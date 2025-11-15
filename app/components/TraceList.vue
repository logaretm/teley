<template>
  <div class="h-full flex flex-col bg-zinc-950">
    <!-- Header -->
    <div class="p-4 border-b border-zinc-800">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-zinc-100">Traces</h2>
        <span
          class="text-xs font-medium text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full"
        >
          {{ traces.length }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Empty State -->
      <div
        v-if="traces.length === 0"
        class="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <div class="text-zinc-500 space-y-2">
          <p class="text-base font-medium">No traces yet</p>
          <p class="text-sm text-zinc-600">
            Waiting for traces from instrumented applications...
          </p>
        </div>
      </div>

      <!-- Trace Cards -->
      <template v-else>
        <TraceCard
          v-for="trace in traces"
          :key="trace.trace_id"
          :trace="trace"
          :is-selected="selectedTraceId === trace.trace_id"
          @select="$emit('select', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trace } from '@types';

interface Props {
  traces: Trace[];
  selectedTraceId: string | null;
}

defineProps<Props>();
defineEmits<{
  select: [traceId: string];
}>();
</script>
