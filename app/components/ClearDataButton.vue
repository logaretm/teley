<template>
  <div class="relative" ref="containerRef">
    <!-- Split Button -->
    <div class="flex items-center bg-zinc-800 rounded-lg overflow-hidden">
      <!-- Main Clear Button -->
      <button
        @click="handleMainClear"
        class="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-xs font-semibold"
        title="Clear current view data"
      >
        <IconPhTrash class="w-4 h-4" />
        <span>Clear</span>
      </button>

      <!-- Divider + Chevron -->
      <button
        @click="dropdownOpen = !dropdownOpen"
        class="px-1.5 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 self-stretch border-l border-zinc-700 transition-colors"
        title="Clear options"
      >
        <IconPhCaretDown class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': dropdownOpen }" />
      </button>
    </div>

    <!-- Dropdown -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 top-full mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 p-3"
    >
      <div class="space-y-1 mb-3">
        <ToggleCheckbox v-model="clearTraces">Traces & Spans</ToggleCheckbox>
        <ToggleCheckbox v-model="clearLogsOption">Logs</ToggleCheckbox>
        <ToggleCheckbox v-model="clearMetricsOption">Metrics</ToggleCheckbox>
      </div>
      <button
        @click="handleClearSelected"
        :disabled="!clearTraces && !clearLogsOption && !clearMetricsOption"
        class="w-full px-3 py-1.5 text-sm font-medium rounded transition-colors"
        :class="clearTraces || clearLogsOption || clearMetricsOption
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'"
      >
        Clear Selected
      </button>
    </div>
  </div>

  <ClearConfirmDialog
    confirm-text="Clear All"
    cancel-text="Cancel"
    variant="danger"
  />
</template>

<script setup lang="ts">
const route = useRoute();
const { clearAllTraces } = useTraces();
const { clearLogs } = useLogs();
const { clearMetrics } = useMetrics();

const containerRef = ref<HTMLElement | null>(null);
const dropdownOpen = ref(false);
const clearTraces = ref(false);
const clearLogsOption = ref(false);
const clearMetricsOption = ref(false);

const isTracesView = computed(() => route.path === '/');
const isLogsView = computed(() => route.path === '/logs');
const isMetricsView = computed(() => route.path === '/metrics');

// Pre-check based on current view when dropdown opens
watch(dropdownOpen, (open) => {
  if (open) {
    clearTraces.value = isTracesView.value;
    clearLogsOption.value = isLogsView.value;
    clearMetricsOption.value = isMetricsView.value;
  }
});

// Click outside to close
function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));

const [ClearConfirmDialog, confirmClear] = useConfirmation(async () => {
  if (clearTraces.value) await clearAllTraces();
  if (clearLogsOption.value) await clearLogs();
  if (clearMetricsOption.value) await clearMetrics();
  dropdownOpen.value = false;
});

function handleMainClear() {
  clearTraces.value = isTracesView.value;
  clearLogsOption.value = isLogsView.value;
  clearMetricsOption.value = isMetricsView.value;

  const viewName = isMetricsView.value ? 'Metrics' : isLogsView.value ? 'Logs' : 'Traces';
  confirmClear(
    `Clear All ${viewName}`,
    `Are you sure you want to clear all ${viewName.toLowerCase()} data? This action cannot be undone.`,
  );
}

function handleClearSelected() {
  const items = [];
  if (clearTraces.value) items.push('traces');
  if (clearLogsOption.value) items.push('logs');
  if (clearMetricsOption.value) items.push('metrics');
  if (items.length === 0) return;

  const label = items.join(' and ');
  confirmClear(
    'Clear Selected Data',
    `Are you sure you want to clear all ${label} data? This action cannot be undone.`,
  );
}
</script>
