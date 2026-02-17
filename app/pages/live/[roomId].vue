<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Live Session Banner -->
    <div class="absolute top-0 left-0 right-0 z-10 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 text-center text-xs text-emerald-400">
      Viewing live session
    </div>

    <!-- Traces Sidebar -->
    <aside
      class="w-[350px] bg-zinc-900 border-r border-zinc-800 overflow-y-auto pt-8"
    >
      <TraceList
        v-model="selectedTraceId"
        :traces="traces"
        :selected-trace-id="selectedTraceId"
      />
    </aside>

    <!-- Main Content -->
    <div class="flex-1 pt-8">
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

// Set session state from route params BEFORE app.vue's onMounted runs initSession()
const roomId = route.params.roomId as string;
const token = (route.query.token as string) || '';

useState('session-roomId', () => roomId);
useState('session-receiveToken', () => token);
useState('session-initialized', () => true);

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
