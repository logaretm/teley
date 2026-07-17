<template>
  <ModalDialog ref="dialog" title="About Teley">
    <template #description>
      A real-time observability dashboard for traces, logs, and metrics.
    </template>

    <div class="flex flex-col gap-4 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-zinc-400">CLI version</span>
        <code class="text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
          teley-cli v{{ config.cliVersion }}
        </code>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-zinc-400">Created by</span>
        <a
          :href="config.authorUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-400 hover:text-blue-300 transition-colors"
        >
          {{ config.authorName }}
        </a>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-zinc-400">Source code</span>
        <a
          :href="config.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <IconPhGithubLogo class="w-4 h-4" />
          GitHub
        </a>
      </div>
    </div>

    <template #footer="{ close }">
      <button
        @click="close"
        class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded transition-colors"
      >
        Close
      </button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
const config = useRuntimeConfig().public;

const dialogRef = useTemplateRef('dialog');

function open() {
  dialogRef.value?.open();
}

function close() {
  dialogRef.value?.close();
}

defineExpose({ open, close });
</script>
