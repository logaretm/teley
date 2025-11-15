<template>
  <div
    class="group relative bg-zinc-950 aria-selected:bg-zinc-800 border-b border-zinc-800 cursor-pointer transition-all duration-200 hover:bg-zinc-900"
    :class="{
      'border-l-2 border-l-red-500': isError,
    }"
    :aria-selected="isSelected"
    @click="$emit('select', trace.trace_id)"
  >
    <div class="p-4">
      <!-- Header Row -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <h3
          class="font-semibold text-zinc-100 text-sm leading-tight flex-1 min-w-0"
        >
          {{ trace.operation_name }}
        </h3>
        <span
          class="text-xs font-bold px-2 py-1 rounded uppercase tracking-wide flex-shrink-0"
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

      <!-- Meta Info -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-400 font-medium truncate">
            {{ trace.service_name }}
          </span>
          <span class="text-zinc-300 font-mono font-semibold text-xs ml-3">
            {{ formatDuration(trace.duration) }}
          </span>
        </div>

        <div class="text-xs text-zinc-500">
          {{ formatTimestamp(trace.start_time) }}
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="isError && trace.status_message"
        class="mt-3 pt-3 border-t border-zinc-800"
      >
        <div class="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">
          {{ trace.status_message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trace } from '@types';
import { SpanStatusCode } from '@opentelemetry/api';
import {
  formatDuration,
  formatTimestamp,
  getStatusColor,
} from '~/utils/formatters';
import { computed } from 'vue';

interface Props {
  trace: Trace;
  isSelected: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  select: [traceId: string];
}>();

const isError = computed(() => props.trace.status_code === 2);

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
