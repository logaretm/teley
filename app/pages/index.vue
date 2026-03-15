<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Traces Sidebar -->
    <aside
      class="w-[350px] bg-zinc-900 border-r border-zinc-800 overflow-y-auto"
    >
      <TraceList
        v-model="selectedTraceId"
        :traces="filteredTraces"
        :selected-trace-id="selectedTraceId"
        :compare-with-trace-id="compareWithTraceId"
        @help="setupDialog?.open()"
        @compare-started="compareWithTraceId = null"
      />
    </aside>

    <!-- Main Content -->
    <TraceDetail v-if="selectedTraceId" :trace-id="selectedTraceId" @compare="startCompare" />

    <div v-else class="flex-1 flex items-center justify-center bg-zinc-950">
      <div class="text-center space-y-6 max-w-md px-8">
        <div
          class="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950"
          />
          <IconPhChartBarHorizontalBold
            class="w-16 h-16 text-zinc-700 relative z-10"
          />
        </div>
        <div class="space-y-3">
          <h3 class="text-xl font-semibold text-zinc-300">No trace selected</h3>
          <p class="text-sm text-zinc-500 leading-relaxed">
            Select a trace from the list to view its waterfall timeline and span
            details
          </p>
        </div>
      </div>
    </div>

    <!-- Setup Guide Modal -->
    <ModalDialog ref="setupGuideDialog" title="Traces Setup Guide">
      <TracesSetupGuide />
    </ModalDialog>

  </div>
</template>

<script setup lang="ts">
const selectedTraceId = ref<string | null>(null);
const compareWithTraceId = ref<string | null>(null);
const setupDialog = useTemplateRef('setupGuideDialog');

const { traces } = useTraces();
const { selectedServices, hasMultipleServices } = useServiceFilter();

const filteredTraces = computed(() => {
  if (!hasMultipleServices.value) return traces.value;
  return traces.value.filter(t => selectedServices.value.has(t.service_name));
});

function startCompare() {
  if (selectedTraceId.value) {
    compareWithTraceId.value = selectedTraceId.value;
  }
}

// Auto-select newest trace
watch(
  () => filteredTraces.value[0],
  (newTrace, oldTrace) => {
    if (newTrace && oldTrace?.trace_id !== newTrace.trace_id) {
      selectedTraceId.value = newTrace.trace_id;
    }
  },
);
</script>
