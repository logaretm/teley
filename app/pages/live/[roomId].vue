<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Live Session Banner -->
    <div class="absolute top-0 left-0 right-0 z-10 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 text-center text-xs text-emerald-400">
      Viewing live session
    </div>

    <!-- Traces Sidebar -->
    <aside
      class="bg-zinc-900 border-r border-zinc-800 overflow-y-auto shrink-0"
      :style="{ width: tracesPanelWidth + 'px' }"
    >
      <TraceList
        v-model="selectedTraceId"
        :traces="traces"
        :selected-trace-id="selectedTraceId"
      />
    </aside>

    <!-- Resize handle -->
    <div
      class="w-1 cursor-col-resize bg-zinc-800 hover:bg-blue-500 transition-colors shrink-0"
      :class="{ 'bg-blue-500': tracesPanelDragging }"
      @mousedown="onTracesPanelMouseDown"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-0">
      <TraceDetail v-if="selectedTraceId" :trace-id="selectedTraceId" />

      <div v-else class="flex-1 flex items-center justify-center bg-zinc-950 h-full">
        <div class="text-center space-y-6 max-w-md px-8">
          <div
            class="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950"
            />
            <IconPhBroadcastBold
              class="w-16 h-16 text-zinc-700 relative z-10"
            />
          </div>
          <div class="space-y-3">
            <h3 class="text-xl font-semibold text-zinc-300">Waiting for traces</h3>
            <p class="text-sm text-zinc-500 leading-relaxed">
              You're connected to a live session. Traces will appear here as they come in.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

// Override session state with live URL params.
// useState keys are already created by app.vue's useSession(), so we must
// assign directly — the init function is ignored for existing keys.
const roomId = route.params.roomId as string;
const token = (route.query.token as string) || '';

const sessionRoomId = useState<string | null>('session-roomId');
const sessionReceiveToken = useState<string | null>('session-receiveToken');
const sessionInitialized = useState<boolean>('session-initialized');

sessionRoomId.value = roomId;
sessionReceiveToken.value = token;
sessionInitialized.value = true;

const { width: tracesPanelWidth, dragging: tracesPanelDragging, onMouseDownLeft: onTracesPanelMouseDown } = useResizablePanel('traces-panel-width', 350);
const selectedTraceId = ref<string | null>(null);
const { traces } = useTraces();

// Auto-select newest trace
watch(
  () => traces.value[0],
  (newTrace, oldTrace) => {
    if (newTrace && oldTrace?.trace_id !== newTrace.trace_id) {
      selectedTraceId.value = newTrace.trace_id;
    }
  },
);
</script>
