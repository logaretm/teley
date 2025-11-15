<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header
      class="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center"
    >
      <h1 class="text-xl font-semibold text-zinc-100">OpenTelemetry Viewer</h1>
      <div class="flex items-center gap-4">
        <div
          class="flex items-center gap-2 text-sm"
          :class="wsConnected ? 'text-green-400' : 'text-zinc-500'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="
              wsConnected
                ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-zinc-500'
            "
          ></span>
          {{ wsConnected ? 'Connected' : 'Disconnected' }}
        </div>
        <button
          @click="handleClearData"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
        >
          Clear All Data
        </button>
      </div>
    </header>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Traces Sidebar -->
      <aside
        class="w-[350px] bg-zinc-900 border-r border-zinc-800 overflow-y-auto"
      >
        <TraceList
          :traces="traces"
          :selected-trace-id="selectedTraceId"
          @select="handleSelectTrace"
        />
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto relative bg-zinc-950">
        <TraceWaterfall
          v-if="selectedTrace"
          :trace="selectedTrace"
          :spans="selectedSpans"
          @select-span="handleSelectSpan"
        />
        <div
          v-else
          class="flex items-center justify-center h-full text-zinc-500 text-base"
        >
          <p>Select a trace to view details</p>
        </div>
      </main>

      <!-- Span Details Sidebar -->
      <aside
        v-if="selectedSpan"
        class="w-[400px] bg-zinc-900 border-l border-zinc-800 overflow-y-auto"
      >
        <SpanDetails :span="selectedSpan" @close="selectedSpan = null" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trace, Span } from '@types';

const { connected: wsConnected } = useWebSocket();
const { traces, fetchTraces, fetchTraceDetails, clearAllTraces } = useTraces();

const selectedTraceId = ref<string | null>(null);
const selectedTrace = ref<Trace | null>(null);
const selectedSpans = ref<Span[]>([]);
const selectedSpan = ref<Span | null>(null);

// Initialize - fetch initial traces
onMounted(async () => {
  await fetchTraces();
});

const handleSelectTrace = async (traceId: string) => {
  selectedTraceId.value = traceId;
  selectedSpan.value = null;

  const data = await fetchTraceDetails(traceId);
  if (data) {
    selectedTrace.value = data.trace;
    selectedSpans.value = data.spans;
  }
};

const handleSelectSpan = (span: Span) => {
  selectedSpan.value = span;
};

const handleClearData = async () => {
  if (confirm('Are you sure you want to clear all trace data?')) {
    const success = await clearAllTraces();
    if (success) {
      selectedTraceId.value = null;
      selectedTrace.value = null;
      selectedSpans.value = [];
      selectedSpan.value = null;
    }
  }
};
</script>
