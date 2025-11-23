<template>
  <div id="traces-setup-guide" class="space-y-6 tab-container">
    <!-- Tabs -->
    <div class="flex gap-2 border-b border-zinc-800 tabs">
      <a
        href="#otlp-guide-traces"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors tab-item inline-flex items-center gap-2"
      >
        <SourceIcon source="OTLP" class="size-4" />
        OpenTelemetry
      </a>
      <a
        href="#sentry-guide-traces"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors tab-item inline-flex items-center gap-2"
      >
        <SourceIcon source="SENTRY" class="size-4" />
        Sentry
      </a>
    </div>

    <div class="tab-content-wrapper">
      <!-- OTLP Instructions -->
      <div id="otlp-guide-traces" class="space-y-6 tab-content">
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
            <div v-html="installCode" class="rounded overflow-hidden" />
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
            <div v-html="configCode" class="rounded overflow-hidden" />
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
            <IconPhInfoBold class="w-5 h-5 text-zinc-400 shrink-0" />
            <div class="space-y-1">
              <p class="text-sm font-medium text-zinc-300">
                Development Environment
              </p>
              <p class="text-sm text-zinc-400">
                Make sure your application can reach
                <code class="inline-code"> http://localhost:3000</code>. If
                running in a container, use the appropriate host address.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sentry Instructions -->
      <div id="sentry-guide-traces" class="space-y-6 tab-content">
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
            Install Sentry SDK
          </h3>
          <div class="ml-8 space-y-3">
            <p class="text-sm text-zinc-400">
              Install the Sentry SDK for your language:
            </p>
            <div v-html="sentryInstallCode" class="rounded overflow-hidden" />
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
            Configure Sentry DSN
          </h3>
          <div class="ml-8 space-y-3">
            <p class="text-sm text-zinc-400">
              Configure Sentry to send traces to this viewer:
            </p>
            <div v-html="sentryConfigCode" class="rounded overflow-hidden" />
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
              Start your application and traces will appear here automatically!
            </p>
          </div>
        </section>

        <!-- Note -->
        <div class="bg-zinc-950 border border-zinc-800 rounded p-4">
          <div class="flex gap-3">
            <IconPhInfoBold class="w-5 h-5 text-zinc-400 shrink-0" />
            <div class="space-y-1">
              <p class="text-sm font-medium text-zinc-300">Sentry DSN Format</p>
              <p class="text-sm text-zinc-400">
                Use the DSN format
                <code class="inline-code">
                  http://public@localhost:3000/[project-id]
                </code>
                where project-id can be any identifier for your project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { codeToHtml } from 'shiki';
import type { ThemeRegistration } from 'shiki';

const installCommand = `npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-http`;

const configCodeSnippet = `import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:3000/api/v1/otlp/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();`;

const sentryInstallCommand = `npm install @sentry/node @sentry/profiling-node`;

const sentryConfigCodeSnippet = `import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'http://public@localhost:3000/my-project',
  tracesSampleRate: 1.0,
  environment: 'development',
});`;

// Custom muted theme based on vesper but tweaked for our zinc aesthetic
const customTheme: ThemeRegistration = {
  name: 'custom-vesper',
  type: 'dark',
  colors: {
    'editor.background': '#09090b',
    'editor.foreground': '#a1a1aa',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: '#52525b',
        fontStyle: 'italic',
      },
    },
    {
      scope: ['string', 'string.quoted'],
      settings: {
        foreground: '#5ac8d8', // Darker cyan - not as bright as vesper
      },
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control'],
      settings: {
        foreground: '#a1a1aa', // zinc-400 - more subtle for keywords
      },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: {
        foreground: '#e8a86d', // Darker warm orange
      },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter'],
      settings: {
        foreground: '#d4d4d8', // zinc-300 - brighter for variables
      },
    },
    {
      scope: ['entity.name.type', 'support.type', 'support.class'],
      settings: {
        foreground: '#9ca3af',
      },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: {
        foreground: '#a8a29e',
      },
    },
    {
      scope: ['punctuation', 'meta.brace'],
      settings: {
        foreground: '#71717a',
      },
    },
    {
      scope: [
        'variable.object.property',
        'meta.object-literal.key',
        'entity.name.tag.yaml',
      ],
      settings: {
        foreground: '#d4d4d8', // zinc-300 - bright like variables
      },
    },
  ],
};

// Server-side only code highlighting
const installCode = await codeToHtml(installCommand, {
  lang: 'bash',
  theme: customTheme,
});

const configCode = await codeToHtml(configCodeSnippet, {
  lang: 'typescript',
  theme: customTheme,
});

const sentryInstallCode = await codeToHtml(sentryInstallCommand, {
  lang: 'bash',
  theme: customTheme,
});

const sentryConfigCode = await codeToHtml(sentryConfigCodeSnippet, {
  lang: 'typescript',
  theme: customTheme,
});
</script>

<style scoped>
@reference '../../app/assets/css/main.css';

:deep(pre) {
  padding: 0.75rem;
  overflow-x: auto;
  font-size: 0.75rem;
  line-height: 1.5;
  background: var(--color-zinc-950) !important; /* zinc-950 */
}

:deep(code) {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;

  .line {
    span {
      font-style: normal !important;
    }
  }
}
</style>
