<template>
  <div class="space-y-6">
    <p class="text-sm text-zinc-400">
      Send traces to this viewer using the endpoints below. Click on your session
      ID in the header to see your unique endpoints.
    </p>

    <!-- Sentry SDK -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">Sentry SDK (JavaScript)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://&lt;your-session-id&gt;@{{ host }}/0",
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
});</code></pre>
    </div>

    <!-- OTLP Exporter -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Exporter (Node.js)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const provider = new NodeTracerProvider();
const exporter = new OTLPTraceExporter({
  url: 'https://{{ host }}/r/&lt;your-session-id&gt;',
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();</code></pre>
    </div>

    <!-- Python -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Exporter (Python)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
exporter = OTLPSpanExporter(
    endpoint="https://{{ host }}/r/&lt;your-room-id&gt;"
)
provider.add_span_processor(SimpleSpanProcessor(exporter))
trace.set_tracer_provider(provider)</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const host = computed(() => {
  if (typeof window === 'undefined') return 'otel-viewer.dev';
  return window.location.host;
});
</script>
