<template>
  <div class="space-y-6">
    <p class="text-sm text-zinc-400">
      Send metrics to this viewer using OTLP exporters or Sentry SDK. Click on your session ID in
      the header to see your unique endpoints.
    </p>

    <!-- Node.js OTLP Metrics -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Metric Exporter (Node.js)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const exporter = new OTLPMetricExporter({
  url: 'https://{{ host }}/r/&lt;your-session-id&gt;',
});

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter,
      exportIntervalMillis: 5000,
    }),
  ],
});

const meter = meterProvider.getMeter('my-service');

// Counter
const counter = meter.createCounter('http.requests');
counter.add(1, { method: 'GET', route: '/api/users' });

// Gauge (via observable)
meter.createObservableGauge('system.memory.usage', {
  unit: 'bytes',
}).addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed);
});

// Histogram
const histogram = meter.createHistogram('http.request.duration', {
  unit: 'ms',
});
histogram.record(42, { method: 'GET', route: '/api/users' });</code></pre>
    </div>

    <!-- Python OTLP Metrics -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">OTLP Metric Exporter (Python)</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter

exporter = OTLPMetricExporter(
    endpoint="https://{{ host }}/r/&lt;your-session-id&gt;"
)
reader = PeriodicExportingMetricReader(exporter, export_interval_millis=5000)
provider = MeterProvider(metric_readers=[reader])

meter = provider.get_meter("my-service")
counter = meter.create_counter("http.requests")
counter.add(1, {"method": "GET"})</code></pre>
    </div>

    <!-- Sentry SDK Metrics -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">Sentry SDK Metrics</h4>
      <pre
        class="text-xs bg-zinc-900 rounded-lg p-4 overflow-x-auto text-zinc-300"
      ><code>import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://&lt;your-session-id&gt;@{{ host }}/0",
});

// Counter
Sentry.metrics.increment("button.click", 1, { tags: { page: "home" } });

// Gauge
Sentry.metrics.gauge("cpu.usage", 65.5, { unit: "percent" });

// Distribution (histogram)
Sentry.metrics.distribution("request.duration", 142, { unit: "ms" });

// Set (unique values)
Sentry.metrics.set("users.active", "user-123");</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const host = computed(() => {
  if (typeof window === 'undefined') return 'teley.dev';
  return window.location.host;
});
</script>
