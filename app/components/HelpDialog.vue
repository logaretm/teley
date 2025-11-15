<template>
  <dialog
    ref="dialog"
    class="backdrop:bg-black/50 p-0 bg-transparent w-full h-full"
    @click="handleBackdropClick"
  >
    <div class="flex items-center justify-center h-full w-full">
      <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold text-zinc-100 mb-1">
              Getting Started
            </h2>
            <p class="text-sm text-zinc-400">
              How to send traces to the OpenTelemetry Viewer
            </p>
          </div>
          <button
            @click="close"
            class="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-6">
          <!-- Step 1 -->
          <section>
            <h3
              class="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2"
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs"
              >
                1
              </span>
              Install OpenTelemetry SDK
            </h3>
            <div class="ml-8 space-y-3">
              <p class="text-sm text-zinc-400">
                Install the OpenTelemetry packages for your language:
              </p>
              <div
                class="bg-zinc-950 rounded p-3 font-mono text-xs text-zinc-300"
              >
                <div class="mb-2 text-zinc-500"># Node.js</div>
                npm install @opentelemetry/sdk-node
                @opentelemetry/auto-instrumentations-node
                @opentelemetry/exporter-trace-otlp-http
              </div>
            </div>
          </section>

          <!-- Step 2 -->
          <section>
            <h3
              class="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2"
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs"
              >
                2
              </span>
              Configure the Exporter
            </h3>
            <div class="ml-8 space-y-3">
              <p class="text-sm text-zinc-400">
                Configure the OTLP exporter to send traces to this viewer:
              </p>
              <div
                class="bg-zinc-950 rounded p-3 font-mono text-xs text-zinc-300 overflow-x-auto"
              >
                <pre class="text-zinc-300">
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:3000/api/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();</pre
                >
              </div>
            </div>
          </section>

          <!-- Step 3 -->
          <section>
            <h3
              class="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2"
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs"
              >
                3
              </span>
              Run Your Application
            </h3>
            <div class="ml-8">
              <p class="text-sm text-zinc-400">
                Start your instrumented application and traces will appear here
                automatically!
              </p>
            </div>
          </section>

          <!-- Note -->
          <div class="bg-zinc-950 border border-zinc-800 rounded p-4">
            <div class="flex gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-zinc-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="space-y-1">
                <p class="text-sm font-medium text-zinc-300">
                  Note: This viewer only supports HTTP/JSON format
                </p>
                <p class="text-xs text-zinc-500">
                  Make sure your exporter is configured to use HTTP with JSON
                  encoding, not gRPC or Protobuf.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 flex justify-end">
          <button
            @click="close"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
const dialogRef = useTemplateRef('dialog');

function open() {
  dialogRef.value?.showModal();
}

function close() {
  dialogRef.value?.close();
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) {
    close();
  }
}

defineExpose({ open, close });
</script>

<style scoped>
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
</style>
