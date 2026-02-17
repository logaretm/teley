<template>
  <div class="h-full flex flex-col bg-zinc-950">
    <!-- Header -->
    <div class="border-b border-zinc-800">
      <div class="p-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-zinc-100">Traces</h2>
          <span
            class="text-xs font-medium text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full"
          >
            {{ filteredTraces.length }}
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="traces.length"
            @click="toggleCompareMode"
            class="p-1.5 rounded transition-colors"
            :class="
              compareMode
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            "
            title="Compare traces"
          >
            <IconPhArrowsLeftRightBold class="w-4 h-4" />
          </button>
          <button
            v-if="traces.length"
            @click="$emit('clear')"
            class="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
            title="Clear all traces"
          >
            <IconPhTrashBold class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="px-4 pb-3">
        <div class="relative">
          <IconPhMagnifyingGlassBold
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search traces..."
            class="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Empty State -->
      <div
        v-if="traces.length === 0"
        class="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <div class="space-y-6 max-w-xs">
          <div
            class="w-24 h-24 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950"
            />
            <IconPhLightning class="w-12 h-12 text-zinc-700 relative z-10" />
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-semibold text-zinc-300">No traces yet</h3>
            <p class="text-sm text-zinc-500 leading-relaxed">
              Waiting for traces from instrumented applications
            </p>
          </div>
          <button
            @click="$emit('help')"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
          >
            Setup Guide
          </button>
        </div>
      </div>

      <!-- Trace Cards -->
      <template v-else>
        <div
          v-if="searchQuery && filteredTraces.length === 0"
          class="p-8 text-center"
        >
          <p class="text-sm text-zinc-500">
            No traces found for "{{ searchQuery }}"
          </p>
        </div>
        <TraceCard
          v-for="trace in filteredTraces"
          :key="trace.trace_id"
          :trace="trace"
          :is-selected="selectedTraceId === trace.trace_id"
          :search-query="debouncedSearch"
          :compare-mode="compareMode"
          :is-compare-selected="selectedForCompare.has(trace.trace_id)"
          :is-compare-disabled="trace.trace_id === lockedTraceId"
          @select="selectedTraceId = $event"
          @toggle-compare="handleToggleCompare"
        />
      </template>
    </div>

    <!-- Compare bar -->
    <div
      v-if="compareMode"
      class="border-t border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between"
    >
      <span class="text-xs text-zinc-400">
        {{ lockedTraceId && selectedForCompare.size === 1 ? 'Select a trace to compare with' : `${selectedForCompare.size} / 2 selected` }}
      </span>
      <div class="flex items-center gap-2">
        <button
          @click="toggleCompareMode"
          class="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          :disabled="selectedForCompare.size !== 2"
          @click="navigateToCompare"
          class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
          :class="
            selectedForCompare.size === 2
              ? 'bg-blue-500 text-white hover:bg-blue-400'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          "
        >
          Compare
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trace } from '@types';
import { refDebounced } from '@vueuse/core';

interface Props {
  traces: Trace[];
  selectedTraceId: string | null;
  compareWithTraceId?: string | null;
}

const props = defineProps<Props>();

const selectedTraceId = defineModel<string | null>({ required: true });

const emit = defineEmits<{
  clear: [];
  help: [];
  compareStarted: [];
}>();

const searchQuery = ref('');
const debouncedSearch = refDebounced(searchQuery, 200);
const compareMode = ref(false);
const selectedForCompare = ref<Set<string>>(new Set());
const lockedTraceId = ref<string | null>(null);

// When compareWithTraceId is set from the trace detail "Compare" button,
// auto-enter compare mode with that trace pre-selected and locked
watch(
  () => props.compareWithTraceId,
  (traceId) => {
    if (traceId) {
      compareMode.value = true;
      lockedTraceId.value = traceId;
      selectedForCompare.value = new Set([traceId]);
      emit('compareStarted');
    }
  },
);

function toggleCompareMode() {
  compareMode.value = !compareMode.value;
  if (!compareMode.value) {
    selectedForCompare.value = new Set();
    lockedTraceId.value = null;
  }
}

function handleToggleCompare(traceId: string) {
  // Don't allow toggling the locked trace
  if (traceId === lockedTraceId.value) return;

  const next = new Set(selectedForCompare.value);
  if (next.has(traceId)) {
    next.delete(traceId);
  } else if (next.size < 2) {
    next.add(traceId);
  }
  selectedForCompare.value = next;

  // Auto-navigate when 2 are selected
  if (next.size === 2) {
    const ids = Array.from(next);
    navigateTo(`/compare?a=${ids[0]}&b=${ids[1]}`);
  }
}

function navigateToCompare() {
  const ids = Array.from(selectedForCompare.value);
  if (ids.length !== 2) return;
  navigateTo(`/compare?a=${ids[0]}&b=${ids[1]}`);
}

const filteredTraces = computed(() => {
  const query = debouncedSearch.value.toLowerCase().trim();
  if (!query) {
    return props.traces;
  }

  return props.traces.filter((trace) => {
    if (trace.trace_id.toLowerCase().includes(query)) {
      return true;
    }
    if (trace.service_name.toLowerCase().includes(query)) {
      return true;
    }
    if (trace.operation_name.toLowerCase().includes(query)) {
      return true;
    }
    return false;
  });
});
</script>
