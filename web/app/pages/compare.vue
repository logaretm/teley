<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-zinc-950">
    <!-- Header -->
    <div class="bg-zinc-900 border-b border-zinc-800 px-2.5 py-4">
      <div class="flex items-center gap-1 mb-4">
        <button
          @click="navigateTo('/')"
          class="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
          title="Back to traces"
        >
          <IconPhArrowLeftBold class="w-4 h-4" />
        </button>
        <h1 class="text-lg font-semibold text-zinc-100">Trace Comparison</h1>

        <!-- Diff Summary Badges -->
        <div v-if="!loading && diffSummary" class="flex items-center gap-2 ml-auto">
          <span class="text-xs font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-400">
            {{ diffSummary.matched }} matched
          </span>
          <span v-if="diffSummary.added" class="text-xs font-mono px-2 py-1 rounded bg-green-500/20 text-green-400">
            +{{ diffSummary.added }} added
          </span>
          <span v-if="diffSummary.removed" class="text-xs font-mono px-2 py-1 rounded bg-red-500/20 text-red-400">
            -{{ diffSummary.removed }} removed
          </span>
          <span v-if="diffSummary.slower" class="text-xs font-mono px-2 py-1 rounded bg-red-500/10 text-red-400">
            {{ diffSummary.slower }} slower
          </span>
          <span v-if="diffSummary.faster" class="text-xs font-mono px-2 py-1 rounded bg-green-500/10 text-green-400">
            {{ diffSummary.faster }} faster
          </span>
        </div>
      </div>

      <!-- Trace Summaries -->
      <div v-if="traceA && traceB" class="grid grid-cols-2 gap-4">
        <div class="bg-zinc-950 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">A</span>
            <span class="text-sm font-semibold text-zinc-200 truncate">{{ traceA.operation_name }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs text-zinc-500">
            <span>{{ traceA.service_name }}</span>
            <span class="font-mono text-zinc-300">{{ formatDuration(traceA.duration) }}</span>
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
              :class="{
                'bg-green-500/20 text-green-400': getStatusColor(traceA.status_code) === 'success',
                'bg-red-500/20 text-red-400': getStatusColor(traceA.status_code) === 'error',
              }"
            >
              {{ traceA.status_code === 2 ? 'ERROR' : 'OK' }}
            </span>
          </div>
        </div>
        <div class="bg-zinc-950 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">B</span>
            <span class="text-sm font-semibold text-zinc-200 truncate">{{ traceB.operation_name }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs text-zinc-500">
            <span>{{ traceB.service_name }}</span>
            <span class="font-mono text-zinc-300">{{ formatDuration(traceB.duration) }}</span>
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
              :class="{
                'bg-green-500/20 text-green-400': getStatusColor(traceB.status_code) === 'success',
                'bg-red-500/20 text-red-400': getStatusColor(traceB.status_code) === 'error',
              }"
            >
              {{ traceB.status_code === 2 ? 'ERROR' : 'OK' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-sm text-zinc-500">Loading traces...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-2">
        <p class="text-sm text-red-400">Failed to load traces</p>
        <p class="text-xs text-zinc-500">{{ error.message }}</p>
      </div>
    </div>

    <!-- Missing traces -->
    <div v-else-if="!traceA || !traceB" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-2">
        <p class="text-sm text-zinc-400">One or both traces could not be found</p>
        <button
          @click="navigateTo('/')"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
        >
          Back to traces
        </button>
      </div>
    </div>

    <!-- Comparison Content -->
    <template v-else>
      <div class="flex-1 overflow-y-auto p-4">
        <TraceCompareWaterfall
          :aligned-rows="filteredRows"
          :selected-row="selectedRow"
          @select-row="selectedRow = $event"
        />
      </div>

      <!-- Span Diff Details (bottom drawer) -->
      <SpanDiffDetails
        v-if="selectedRow"
        :row="selectedRow"
        @close="selectedRow = null"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatDuration, getStatusColor } from '~/utils/formatters';

const route = useRoute();

const traceIdA = computed(() => String(route.query.a || ''));
const traceIdB = computed(() => String(route.query.b || ''));

const {
  traceA,
  traceB,
  alignedRows,
  selectedRow,
  diffSummary,
  loading,
  error,
} = useTraceComparison(traceIdA, traceIdB);

const filteredRows = computed(() => {
  return alignedRows.value.filter((row) => {
    if (row.type === 'added' || row.type === 'removed') return true;
    if (!row.diff) return false;
    return (
      row.diff.durationDelta !== 0 ||
      row.diff.statusChanged ||
      row.diff.attributeDiffs.some((d) => d.type !== 'unchanged')
    );
  });
});
</script>
