<template>
  <div
    class="group relative bg-zinc-950 aria-selected:bg-zinc-800 border-b border-zinc-800 cursor-pointer transition-all duration-200 hover:bg-zinc-900"
    :class="{
      'border-l-2 border-l-red-500': isError,
      'ring-1 ring-inset ring-blue-500/50': compareMode && isCompareSelected,
      'opacity-40 cursor-not-allowed': compareMode && isCompareDisabled,
    }"
    :aria-selected="isSelected"
    @click="handleClick"
  >
    <div class="p-4 flex gap-3">
      <!-- Compare checkbox -->
      <div
        v-if="compareMode"
        class="flex items-center shrink-0"
        @click.stop="$emit('toggleCompare', trace.trace_id)"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          :class="
            isCompareSelected
              ? 'bg-blue-500 border-blue-500'
              : 'border-zinc-600 hover:border-zinc-400'
          "
        >
          <IconPhCheckBold
            v-if="isCompareSelected"
            class="w-3 h-3 text-white"
          />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Header Row -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0 space-y-1">
            <h3
              class="font-semibold text-zinc-100 text-sm leading-tight"
              v-html="highlightText(trace.operation_name)"
            />
            <p
              class="font-mono text-xs text-zinc-600 tracking-wide"
              v-html="highlightText(shortTraceId)"
            />
          </div>
          <span
            class="text-xs font-bold px-2 py-1 rounded uppercase tracking-wide shrink-0"
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
            <div class="flex items-center gap-1.5 min-w-0">
              <SourceIcon class="size-4" :source="trace.source" />
              <span
                class="text-zinc-400 font-medium truncate"
                v-html="highlightText(trace.service_name)"
              />
            </div>
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
  searchQuery?: string;
  compareMode?: boolean;
  isCompareSelected?: boolean;
  isCompareDisabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [traceId: string];
  toggleCompare: [traceId: string];
}>();

function handleClick() {
  if (props.compareMode) {
    if (props.isCompareDisabled) return;
    emit('toggleCompare', props.trace.trace_id);
  } else {
    emit('select', props.trace.trace_id);
  }
}

const isError = computed(() => props.trace.status_code === 2);
const shortTraceId = computed(() => props.trace.trace_id.slice(0, 8));

// Highlight matching text
function highlightText(text: string): string {
  if (!props.searchQuery?.trim()) {
    return text;
  }

  const query = props.searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return `${before}<mark class="bg-yellow-500/30 text-yellow-200">${match}</mark>${after}`;
}

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
