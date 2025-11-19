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
        Install OpenTelemetry Logs SDK
      </h3>
      <div class="ml-8 space-y-3">
        <p class="text-sm text-zinc-400">
          Install the OpenTelemetry logs packages for your language:
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
        Configure the Log Exporter
      </h3>
      <div class="ml-8 space-y-3">
        <p class="text-sm text-zinc-400">
          Configure the OTLP log exporter to send logs to this viewer:
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
        Emit Logs
      </h3>
      <div class="ml-8 space-y-3">
        <p class="text-sm text-zinc-400">
          Start logging and your logs will appear here automatically:
        </p>
        <div v-html="usageCode" class="rounded overflow-hidden" />
      </div>
    </section>

    <!-- Note -->
    <div class="bg-zinc-950 border border-zinc-800 rounded p-4">
      <div class="flex gap-3">
        <IconPhInfoBold class="w-5 h-5 text-zinc-400 shrink-0" />
        <div class="space-y-1">
          <p class="text-sm font-medium text-zinc-300">Logs Endpoint</p>
          <p class="text-sm text-zinc-400">
            Send OTLP logs to
            <code class="px-1.5 py-0.5 bg-zinc-900 rounded text-zinc-300">
              http://localhost:3000/api/v1/logs
            </code>
            . Logs can include trace_id and span_id for correlation.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { codeToHtml } from 'shiki';
import type { ThemeRegistration } from 'shiki';

const installCommand = `npm install @opentelemetry/sdk-logs \\
  @opentelemetry/exporter-logs-otlp-http \\
  @opentelemetry/api-logs`;

const configCodeSnippet = `import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';

const logExporter = new OTLPLogExporter({
  url: 'http://localhost:3000/api/v1/logs',
});

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(logExporter)
);

logs.setGlobalLoggerProvider(loggerProvider);`;

const usageCodeSnippet = `import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('my-app');

logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: 'INFO',
  body: 'Application started successfully',
  attributes: {
    'service.version': '1.0.0',
    'environment': 'development'
  }
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
        foreground: '#5ac8d8',
      },
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control'],
      settings: {
        foreground: '#a1a1aa',
      },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: {
        foreground: '#e8a86d',
      },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter'],
      settings: {
        foreground: '#d4d4d8',
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
        foreground: '#d4d4d8',
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

const usageCode = await codeToHtml(usageCodeSnippet, {
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
  background: var(--color-zinc-950) !important;
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
