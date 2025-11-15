<template>
  <div class="app">
    <header class="app-header">
      <h1>OpenTelemetry Viewer</h1>
      <div class="header-actions">
        <div class="connection-status" :class="{ connected: wsConnected }">
          <span class="status-dot"></span>
          {{ wsConnected ? 'Connected' : 'Disconnected' }}
        </div>
        <button @click="handleClearData" class="btn btn-danger">
          Clear All Data
        </button>
      </div>
    </header>

    <div class="app-body">
      <aside class="traces-sidebar">
        <TraceList
          :traces="traces"
          :selected-trace-id="selectedTraceId"
          @select="handleSelectTrace"
        />
      </aside>

      <main class="trace-detail">
        <TraceWaterfall
          v-if="selectedTrace"
          :trace="selectedTrace"
          :spans="selectedSpans"
          @select-span="handleSelectSpan"
        />
        <div v-else class="empty-state">
          <p>Select a trace to view details</p>
        </div>
      </main>

      <aside v-if="selectedSpan" class="span-sidebar">
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  color: #e4e4e7;
  background: #09090b;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fafafa;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #71717a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #71717a;
}

.connection-status.connected .status-dot {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.traces-sidebar {
  width: 350px;
  background: #18181b;
  border-right: 1px solid #27272a;
  overflow-y: auto;
}

.trace-detail {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.span-sidebar {
  width: 400px;
  background: #18181b;
  border-left: 1px solid #27272a;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #71717a;
  font-size: 1rem;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #18181b;
}

::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
