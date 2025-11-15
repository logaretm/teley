<template>
  <div class="h-full flex flex-col bg-zinc-950">
    <!-- Header -->
    <div class="p-4 border-b border-zinc-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-zinc-100">Traces</h2>
          <span
            class="text-xs font-medium text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full"
          >
            {{ traces.length }}
          </span>
        </div>
        <button
          @click="$emit('clear')"
          class="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
          title="Clear all traces"
        >
          <IconPhTrashBold class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Empty State -->
      <div
        v-if="traces.length === 0"
        class="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <div class="space-y-4 max-w-xs">
          <div
            class="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center"
          >
            <IconPhLightning class="w-8 h-8 text-zinc-500" />
          </div>
          <div class="space-y-2">
            <p class="text-base font-medium text-zinc-300">No traces yet</p>
            <p class="text-sm text-zinc-500">
              Waiting for traces from instrumented applications
            </p>
          </div>
          <button
            @click="$emit('help')"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded transition-colors"
          >
            How to get started
          </button>
        </div>
      </div>

      <!-- Trace Cards -->
      <template v-else>
        <TraceCard
          v-for="trace in traces"
          :key="trace.trace_id"
          :trace="trace"
          :is-selected="selectedTraceId === trace.trace_id"
          @select="selectedTraceId = $event"
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

const selectedTraceId = defineModel<string | null>({ required: true });

defineEmits<{
  clear: [];
  help: [];
}>();
</script>
