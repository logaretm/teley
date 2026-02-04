<template>
  <ModalDialog :open="open" @close="$emit('close')">
    <template #title>Setup Your Telemetry</template>
    <template #content>
      <div class="space-y-6">
        <p class="text-sm text-zinc-400">
          Use the following endpoints to send telemetry data to this viewer.
          Your room ID is: <code class="text-emerald-400">{{ roomId }}</code>
        </p>

        <!-- Sentry DSN -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-300">
            Sentry DSN
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="sentryDSN"
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
            />
            <button
              @click="copyToClipboard(sentryDSN, 'dsn')"
              class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              :class="copiedDsn ? 'text-emerald-400' : 'text-zinc-300'"
            >
              <IconMdiContentCopy v-if="!copiedDsn" class="w-4 h-4" />
              <IconMdiCheck v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-zinc-500">
            Configure your Sentry SDK with this DSN
          </p>
        </div>

        <!-- OTLP Endpoint -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-300">
            OTLP Endpoint
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="otlpEndpoint"
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
            />
            <button
              @click="copyToClipboard(otlpEndpoint, 'otlp')"
              class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              :class="copiedOtlp ? 'text-emerald-400' : 'text-zinc-300'"
            >
              <IconMdiContentCopy v-if="!copiedOtlp" class="w-4 h-4" />
              <IconMdiCheck v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-zinc-500">
            Configure your OTLP exporter with this endpoint
          </p>
        </div>

        <!-- Instructions -->
        <div class="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <h4 class="text-sm font-medium text-zinc-300">Quick Start</h4>

          <div class="space-y-2">
            <p class="text-xs text-zinc-400">
              <strong class="text-zinc-300">Sentry SDK:</strong>
            </p>
            <pre
              class="text-xs bg-zinc-900 rounded p-2 overflow-x-auto text-zinc-300"
            ><code>Sentry.init({
  dsn: "{{ sentryDSN }}",
  tracesSampleRate: 1.0,
});</code></pre>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-zinc-400">
              <strong class="text-zinc-300">OTLP Exporter (Node.js):</strong>
            </p>
            <pre
              class="text-xs bg-zinc-900 rounded p-2 overflow-x-auto text-zinc-300"
            ><code>new OTLPTraceExporter({
  url: "{{ otlpEndpoint }}",
});</code></pre>
          </div>
        </div>
      </div>
    </template>
    <template #actions>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
      >
        Got it
      </button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import IconMdiContentCopy from '~icons/mdi/content-copy';
import IconMdiCheck from '~icons/mdi/check';

const props = defineProps<{
  open: boolean;
  roomId: string;
}>();

defineEmits<{
  close: [];
}>();

const copiedDsn = ref(false);
const copiedOtlp = ref(false);

const host = computed(() => {
  if (typeof window === 'undefined') return 'otel-viewer.dev';
  return window.location.host;
});

const protocol = computed(() => {
  if (typeof window === 'undefined') return 'https:';
  return window.location.protocol;
});

const sentryDSN = computed(() => {
  return `${protocol.value}//${props.roomId}@${host.value}/0`;
});

const otlpEndpoint = computed(() => {
  return `${protocol.value}//${host.value}/r/${props.roomId}`;
});

const copyToClipboard = async (text: string, type: 'dsn' | 'otlp') => {
  try {
    await navigator.clipboard.writeText(text);
    if (type === 'dsn') {
      copiedDsn.value = true;
      setTimeout(() => (copiedDsn.value = false), 2000);
    } else {
      copiedOtlp.value = true;
      setTimeout(() => (copiedOtlp.value = false), 2000);
    }
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
</script>
