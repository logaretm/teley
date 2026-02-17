<template>
  <div class="bg-zinc-900 border-t border-zinc-800">
    <!-- Header -->
    <div class="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-zinc-100">Span Diff</h3>
        <span
          v-if="row.type === 'matched'"
          class="text-xs font-mono px-2 py-0.5 rounded"
          :class="row.spanA?.span.name === row.spanB?.span.name ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-500/20 text-amber-400'"
        >
          {{ row.spanA?.span.name }}
        </span>
        <span
          v-else-if="row.type === 'added'"
          class="text-xs font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-400"
        >
          + {{ row.spanB?.span.name }}
        </span>
        <span
          v-else
          class="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400"
        >
          - {{ row.spanA?.span.name }}
        </span>
      </div>
      <button
        @click="$emit('close')"
        class="w-7 h-7 flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 rounded transition-colors"
      >
        <IconPhXBold class="w-4 h-4" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-zinc-800">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 text-xs font-medium transition-colors border-b-2"
        :class="
          activeTab === tab.id
            ? 'text-blue-400 border-blue-400'
            : 'text-zinc-500 border-transparent hover:text-zinc-300'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="max-h-80 overflow-y-auto">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="p-4">
        <div v-if="row.type === 'matched' && row.spanA && row.spanB" class="space-y-2">
          <div
            v-for="field in overviewFields"
            :key="field.label"
            class="grid grid-cols-[120px_1fr_1fr] gap-2 p-2 rounded text-sm"
            :class="field.changed ? 'bg-amber-500/5 border-l-2 border-amber-500' : 'bg-zinc-950'"
          >
            <span class="text-xs text-zinc-500 uppercase tracking-wide font-bold">{{ field.label }}</span>
            <span class="text-xs font-mono" :class="field.changed ? 'text-red-400' : 'text-zinc-300'">
              {{ field.valueA }}
            </span>
            <span class="text-xs font-mono" :class="field.changed ? 'text-green-400' : 'text-zinc-300'">
              {{ field.valueB }}
            </span>
          </div>
        </div>
        <div v-else class="p-4 text-sm text-zinc-500 text-center">
          {{ row.type === 'added' ? 'This span only exists in Trace B' : 'This span only exists in Trace A' }}
        </div>
      </div>

      <!-- Attributes Tab -->
      <div v-if="activeTab === 'attributes'" class="p-4">
        <div v-if="row.type === 'matched' && row.diff?.attributeDiffs.length" class="space-y-1">
          <div
            v-for="attr in row.diff.attributeDiffs"
            :key="attr.key"
            class="grid grid-cols-[160px_1fr_1fr] gap-2 p-2 rounded text-xs font-mono"
            :class="getAttrRowClass(attr.type)"
          >
            <span class="text-zinc-400 break-words">
              <span v-if="attr.type === 'added'" class="text-green-500 mr-1">+</span>
              <span v-else-if="attr.type === 'removed'" class="text-red-500 mr-1">-</span>
              <span v-else-if="attr.type === 'changed'" class="text-amber-500 mr-1">~</span>
              {{ attr.key }}
            </span>
            <span class="text-zinc-300 break-all whitespace-pre-wrap">
              {{ attr.type !== 'added' ? formatValue(attr.valueA) : '' }}
            </span>
            <span class="text-zinc-300 break-all whitespace-pre-wrap">
              {{ attr.type !== 'removed' ? formatValue(attr.valueB) : '' }}
            </span>
          </div>
        </div>
        <div v-else-if="row.type === 'matched'" class="p-4 text-sm text-zinc-500 text-center">
          No attribute differences
        </div>
        <div v-else class="p-4">
          <div
            v-for="(value, key) in (row.spanA || row.spanB)?.span.attributes"
            :key="key"
            class="grid grid-cols-[160px_1fr] gap-2 p-2 rounded text-xs font-mono bg-zinc-950"
          >
            <span class="text-zinc-400 break-words">{{ key }}</span>
            <span class="text-zinc-300 break-all whitespace-pre-wrap">{{ formatValue(value) }}</span>
          </div>
        </div>
      </div>

      <!-- Events Tab -->
      <div v-if="activeTab === 'events'" class="p-4">
        <div v-if="row.type === 'matched' && row.diff" class="space-y-2">
          <div class="text-xs text-zinc-500 mb-3">
            Trace A: {{ row.spanA?.span.events.length || 0 }} events
            <span class="mx-2">|</span>
            Trace B: {{ row.spanB?.span.events.length || 0 }} events
            <span
              v-if="row.diff.eventCountDelta !== 0"
              class="ml-2 font-mono"
              :class="row.diff.eventCountDelta > 0 ? 'text-green-400' : 'text-red-400'"
            >
              ({{ row.diff.eventCountDelta > 0 ? '+' : '' }}{{ row.diff.eventCountDelta }})
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div
                v-for="(event, idx) in row.spanA?.span.events || []"
                :key="idx"
                class="p-2 bg-zinc-950 rounded text-xs"
              >
                <span class="text-zinc-200 font-medium">{{ event.name }}</span>
              </div>
              <div v-if="!row.spanA?.span.events.length" class="text-xs text-zinc-600 text-center p-2">
                No events
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(event, idx) in row.spanB?.span.events || []"
                :key="idx"
                class="p-2 bg-zinc-950 rounded text-xs"
              >
                <span class="text-zinc-200 font-medium">{{ event.name }}</span>
              </div>
              <div v-if="!row.spanB?.span.events.length" class="text-xs text-zinc-600 text-center p-2">
                No events
              </div>
            </div>
          </div>
        </div>
        <div v-else class="p-4 text-sm text-zinc-500 text-center">
          Events for {{ row.type === 'added' ? 'added' : 'removed' }} span
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlignedRow } from '~/composables/useTraceComparison';
import { formatDuration, getSpanKindLabel } from '~/utils/formatters';
import { SpanStatusCode } from '@opentelemetry/api';

const props = defineProps<{
  row: AlignedRow;
}>();

defineEmits<{
  close: [];
}>();

const activeTab = ref<'overview' | 'attributes' | 'events'>('overview');

const tabs = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'attributes' as const, label: 'Attributes' },
  { id: 'events' as const, label: 'Events' },
];

const overviewFields = computed(() => {
  const row = props.row;
  if (!row?.spanA || !row?.spanB) return [];

  const a = row.spanA.span;
  const b = row.spanB.span;

  return [
    {
      label: 'Name',
      valueA: a.name,
      valueB: b.name,
      changed: a.name !== b.name,
    },
    {
      label: 'Kind',
      valueA: getSpanKindLabel(a.kind),
      valueB: getSpanKindLabel(b.kind),
      changed: a.kind !== b.kind,
    },
    {
      label: 'Duration',
      valueA: formatDuration(a.duration),
      valueB: formatDuration(b.duration),
      changed: a.duration !== b.duration,
    },
    {
      label: 'Status',
      valueA: getStatusLabel(a.status_code),
      valueB: getStatusLabel(b.status_code),
      changed: a.status_code !== b.status_code,
    },
    {
      label: 'Events',
      valueA: `${a.events.length}`,
      valueB: `${b.events.length}`,
      changed: a.events.length !== b.events.length,
    },
  ];
});

function getStatusLabel(code: number): string {
  switch (code) {
    case SpanStatusCode.ERROR:
      return 'ERROR';
    case SpanStatusCode.OK:
      return 'OK';
    default:
      return 'UNSET';
  }
}

function getAttrRowClass(type: string): string {
  switch (type) {
    case 'added':
      return 'bg-green-500/5 border-l-2 border-green-500';
    case 'removed':
      return 'bg-red-500/5 border-l-2 border-red-500';
    case 'changed':
      return 'bg-amber-500/5 border-l-2 border-amber-500';
    default:
      return 'bg-zinc-950';
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
</script>
