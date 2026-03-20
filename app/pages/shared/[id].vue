<template>
  <div class="flex-1 flex overflow-hidden">
    <main class="flex-1 overflow-y-auto relative bg-zinc-950">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-full text-zinc-500">
        <p>Loading shared trace...</p>
      </div>

      <!-- Error / Expired -->
      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div class="text-center space-y-4 max-w-md px-8">
          <div class="w-20 h-20 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center">
            <IconPhLinkBreakBold class="w-10 h-10 text-zinc-600" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-300">Trace not found</h3>
          <p class="text-sm text-zinc-500">
            This shared trace link may have expired or is invalid. Shared traces are available for 24 hours.
          </p>
        </div>
      </div>

      <!-- Trace Waterfall -->
      <TraceWaterfall
        v-else-if="trace && spans.length > 0"
        :trace="trace"
        :spans="spans"
        @select-span="selectedSpan = $event"
      />
    </main>

    <!-- Span Details Sidebar -->
    <template v-if="selectedSpan">
      <div
        class="w-1 cursor-col-resize bg-zinc-800 hover:bg-blue-500/50 transition-colors shrink-0"
        :class="{ 'bg-blue-500/50': spanPanelDragging }"
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
import type { Trace, Span } from '@types';

// Prevent initSession() from creating a new session
useState('session-initialized', () => true);

const route = useRoute();
const id = route.params.id as string;

const trace = ref<Trace | null>(null);
const spans = ref<Span[]>([]);
const selectedSpan = ref<Span>();
const { width: spanPanelWidth, dragging: spanPanelDragging, onMouseDown: onSpanPanelMouseDown } = useResizablePanel('span-panel-width', 400);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    const res = await fetch(`/api/share/${id}`);
    if (!res.ok) {
      error.value = true;
      return;
    }
    const data = await res.json();
    trace.value = data.trace;
    spans.value = data.spans;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
