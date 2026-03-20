<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Waterfall -->
    <main class="flex-1 overflow-y-auto relative bg-zinc-950">
      <TraceWaterfall
        v-if="trace && spans.length > 0"
        ref="waterfallRef"
        :trace="trace"
        :spans="spans"
        @select-span="handleSelectSpan"
        @compare="$emit('compare')"
        @share="handleShare"
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
        class="w-1 cursor-col-resize bg-zinc-800 hover:bg-blue-500 transition-colors shrink-0"
        :class="{ 'bg-blue-500': spanPanelDragging }"
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

interface Props {
  traceId: string;
}

const props = defineProps<Props>();
defineEmits<{ compare: [] }>();

const getTraceId = () => props.traceId;

const { trace, spans, loading, error } = useTraceDetails(getTraceId);
const selectedSpan = ref<Span>();
const { width: spanPanelWidth, dragging: spanPanelDragging, onMouseDown: onSpanPanelMouseDown } = useResizablePanel('span-panel-width', 400);
const waterfallRef = ref<InstanceType<typeof TraceWaterfall> | null>(null);

// Reset selected span when trace changes
watch(getTraceId, () => {
  selectedSpan.value = undefined;
});

function handleSelectSpan(span: Span) {
  selectedSpan.value = span;
}

async function handleShare() {
  if (!trace.value) return;

  try {
    waterfallRef.value?.setShareLabel('Sharing...');
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trace: trace.value, spans: spans.value }),
    });
    const { id } = await res.json();
    const url = `${window.location.origin}/shared/${id}`;
    await navigator.clipboard.writeText(url);
    waterfallRef.value?.setShareLabel('Copied!');
    setTimeout(() => waterfallRef.value?.setShareLabel('Share'), 2000);
  } catch (err) {
    console.error('Failed to share trace:', err);
    waterfallRef.value?.setShareLabel('Share');
  }
}
</script>
