<template>
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
            <code class="px-1.5 py-0.5 bg-zinc-900 rounded text-zinc-300">
              http://localhost:3000
            </code>
            . If running in a container, use the appropriate host address.
          </p>
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
</script>

<style scoped>
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
