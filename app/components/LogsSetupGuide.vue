<template>
  <div class="space-y-6">
    <p class="text-sm text-zinc-400">
      Send logs to this viewer using OTLP exporters. Click on your room ID in
      the header to see your unique endpoints.
    </p>

    <!-- Node.js OTLP Logs -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Log Exporter (Node.js)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

const loggerProvider = new LoggerProvider();
const exporter = new OTLPLogExporter({
  url: 'https://{{ host }}/r/&lt;your-room-id&gt;',
});

loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(exporter)
);

const logger = loggerProvider.getLogger('my-service');
logger.emit({
  body: 'Hello from OTLP!',
  severityNumber: 9,
  severityText: 'INFO',
});</code></pre>
    </div>

    <!-- Python OTLP Logs -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Log Exporter (Python)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import SimpleLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter

logger_provider = LoggerProvider()
exporter = OTLPLogExporter(
    endpoint="https://{{ host }}/r/&lt;your-room-id&gt;"
)
logger_provider.add_log_record_processor(
    SimpleLogRecordProcessor(exporter)
)</code></pre>
    </div>

    <!-- Sentry SDK (logs via errors) -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">Sentry SDK (Errors as Logs)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://&lt;your-room-id&gt;@{{ host }}/0",
});

// Errors sent to Sentry will appear as logs
Sentry.captureMessage("Info message", "info");
Sentry.captureException(new Error("Something went wrong"));</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const host = computed(() => {
  if (typeof window === 'undefined') return 'otel-viewer.dev';
  return window.location.host;
});
</script>
