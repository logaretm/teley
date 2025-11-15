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
        <div class="flex items-center gap-2 text-sm text-zinc-400">
          <span>Live</span>
          <ToggleSwitch v-model="liveMode" />
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Traces Sidebar -->
      <aside
        class="w-[350px] bg-zinc-900 border-r border-zinc-800 overflow-y-auto"
      >
        <TraceList
          v-model="selectedTraceId"
          :traces="traces"
          :selected-trace-id="selectedTraceId"
          @clear="handleClearData"
          @help="helpDialog?.open()"
        />
      </aside>

      <HelpDialog ref="helpDialog" />

      <!-- Main Content -->
      <TraceDetail v-if="selectedTraceId" :trace-id="selectedTraceId" />

      <div
        v-else
        class="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500 text-base"
      >
        <p>Select a trace to view details</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { connected: wsConnected } = useWebSocket();
const { traces, clearAllTraces } = useTraces();

const selectedTraceId = ref<string | null>(null);
const liveMode = ref(false);
const helpDialog = ref<{ open: () => void; close: () => void } | null>(null);

async function handleClearData() {
  if (confirm('Are you sure you want to clear all trace data?')) {
    const success = await clearAllTraces();
    if (success) {
      selectedTraceId.value = null;
    }
  }
}

// Watch for new traces in live mode
watch(
  () => traces.value[0],
  (newTrace, oldTrace) => {
    if (!liveMode.value) return;

    if (newTrace && oldTrace?.trace_id !== newTrace.trace_id) {
      selectedTraceId.value = newTrace.trace_id;
    }
  },
);
</script>
