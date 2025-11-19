<template>
  <!-- Main Row -->
  <tr
    class="border-b border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors group"
    @click="toggleExpanded"
  >
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        <!-- Severity Indicator Dot -->
        <div
          class="w-2 h-2 rounded-full shrink-0"
          :class="severityDotColor"
          :title="getSeverityLabel(log.severity_number, log.severity_text)"
        ></div>

        <!-- Timestamp -->
        <span class="text-xs text-zinc-400 font-mono whitespace-nowrap">
          {{ formatTimestamp(log.timestamp) }}
        </span>

        <!-- Service Name -->
        <span class="text-sm text-zinc-300 font-medium whitespace-nowrap">
          {{ log.service_name }}
        </span>

        <!-- Message -->
        <span class="text-sm text-zinc-400 truncate flex-1 min-w-0">
          {{ log.body }}
        </span>

        <!-- Expand Icon -->
        <IconPhCaretDown
          :class="isExpanded ? 'rotate-180' : ''"
          class="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors shrink-0"
        />
      </div>
    </td>
  </tr>

  <!-- Expanded Details Row -->
  <tr v-if="isExpanded" class="border-b border-zinc-800 bg-zinc-900/30">
    <td class="px-4 py-4">
      <div class="space-y-4">
        <!-- Full Message -->
        <div>
          <h4 class="text-xs font-semibold text-zinc-400 uppercase mb-2">
            Full Message
          </h4>
          <div
            class="bg-zinc-900 rounded px-4 py-3 text-sm text-zinc-300 font-mono whitespace-pre-wrap wrap-break-words"
          >
            {{ log.body }}
          </div>
        </div>

        <!-- Trace Correlation -->
        <div v-if="log.trace_id || log.span_id" class="flex gap-6">
          <div v-if="log.trace_id">
            <h4 class="text-xs font-semibold text-zinc-400 uppercase mb-2">
              Trace ID
            </h4>
            <div class="text-sm text-zinc-300 font-mono">
              {{ log.trace_id }}
            </div>
          </div>
          <div v-if="log.span_id">
            <h4 class="text-xs font-semibold text-zinc-400 uppercase mb-2">
              Span ID
            </h4>
            <div class="text-sm text-zinc-300 font-mono">
              {{ log.span_id }}
            </div>
          </div>
        </div>

        <!-- Attributes -->
        <div v-if="parsedAttributes.length > 0">
          <h4 class="text-xs font-semibold text-zinc-400 uppercase mb-2">
            Attributes
          </h4>
          <div class="bg-zinc-900 rounded px-4 py-3 space-y-1">
            <div
              v-for="[key, value] in parsedAttributes"
              :key="key"
              class="flex gap-2 text-sm"
            >
              <span class="text-zinc-500 font-mono">{{ key }}:</span>
              <span class="text-zinc-300 font-mono break-all">{{
                formatAttributeValue(value)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { Log } from '@types';
import { formatTimestamp, getSeverityLabel } from '~/utils/formatters';

interface Props {
  log: Log;
  isExpanded: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  toggleExpanded: [];
}>();

const parsedAttributes = computed(() => {
  try {
    const attrs = JSON.parse(props.log.attributes);
    return Object.entries(attrs);
  } catch {
    return [];
  }
});

const severityDotColor = computed(() => {
  const severity = props.log.severity_number;

  // Map severity numbers to full Tailwind bg classes
  if (severity >= 21) return 'bg-red-400'; // FATAL
  if (severity >= 17) return 'bg-red-400'; // ERROR
  if (severity >= 13) return 'bg-amber-400'; // WARN
  if (severity >= 9) return 'bg-blue-400'; // INFO
  if (severity >= 5) return 'bg-purple-400'; // DEBUG
  if (severity >= 1) return 'bg-zinc-400'; // TRACE

  return 'bg-zinc-400'; // UNSET
});

function formatAttributeValue(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function toggleExpanded() {
  emit('toggleExpanded');
}
</script>
