<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Waterfall -->
    <main class="flex-1 overflow-y-auto relative bg-zinc-950">
      <TraceWaterfall
        v-if="trace && spans.length > 0"
        :trace="trace"
        :spans="spans"
        @select-span="handleSelectSpan"
      />
      <div
        v-else-if="loading"
        class="flex items-center justify-center h-full text-zinc-500"
      >
        <p>Loading trace details...</p>
      </div>
      <div
        v-else-if="error"
        class="flex items-center justify-center h-full text-red-500"
      >
        <p>Error loading trace: {{ error.message }}</p>
      </div>
    </main>

    <!-- Span Details Sidebar -->
    <aside
      v-if="selectedSpan"
      class="w-[400px] bg-zinc-900 border-l border-zinc-800 overflow-y-auto"
    >
      <SpanDetails :span="selectedSpan" @close="selectedSpan = undefined" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { Span } from '@types';

interface Props {
  traceId: string;
}

const props = defineProps<Props>();

const getTraceId = () => props.traceId;

const { trace, spans, loading, error } = useTraceDetails(getTraceId);
const selectedSpan = ref<Span>();

// Reset selected span when trace changes
watch(getTraceId, () => {
  selectedSpan.value = undefined;
});

function handleSelectSpan(span: Span) {
  selectedSpan.value = span;
}
</script>
