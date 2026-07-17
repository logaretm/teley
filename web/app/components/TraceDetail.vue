<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Waterfall -->
    <main class="flex-1 overflow-y-auto relative bg-zinc-950">
      <TraceWaterfall
        v-if="trace && spans.length > 0"
        :trace="trace"
        :spans="spans"
        @select-span="handleSelectSpan"
        @compare="$emit('compare')"
        @share="handleShare"
        @rename="handleRename"
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
    <template v-if="selectedSpan">
      <div
        class="w-0 cursor-col-resize border-l border-zinc-800 hover:border-zinc-600 transition-colors shrink-0 -mx-[1.5px] px-[1.5px] z-10"
        :class="{ 'border-zinc-600': spanPanelDragging }"
        @mousedown="onSpanPanelMouseDown"
      />
      <aside
        class="bg-zinc-900 overflow-y-auto shrink-0"
        :style="{ width: spanPanelWidth + 'px' }"
      >
        <SpanDetails :span="selectedSpan" @close="selectedSpan = undefined" />
      </aside>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Span } from '@types';
import { openInSpanshot } from '~/utils/spanshot';

interface Props {
  traceId: string;
}

const props = defineProps<Props>();
defineEmits<{ compare: [] }>();

const getTraceId = () => props.traceId;

const { trace, spans, loading, error } = useTraceDetails(getTraceId);
const { renameTrace } = useTraces();
const selectedSpan = ref<Span>();
const { width: spanPanelWidth, dragging: spanPanelDragging, onMouseDown: onSpanPanelMouseDown } = useResizablePanel('span-panel-width', 400);

// Reset selected span when trace changes
watch(getTraceId, () => {
  selectedSpan.value = undefined;
});

function handleSelectSpan(span: Span) {
  selectedSpan.value = span;
}

async function handleRename(name: string | null) {
  if (!trace.value) return;
  await renameTrace(trace.value.trace_id, name);
  trace.value = { ...trace.value, custom_name: name?.trim() || undefined };
}

// Open the trace in Spanshot (spanshot.dev) in a new tab.
function handleShare() {
  if (!trace.value) return;
  void openInSpanshot(trace.value, spans.value);
}
</script>
