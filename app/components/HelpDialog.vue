<template>
  <ModalDialog
    ref="dialog"
    title="Getting Started"
    description="How to send traces to the OpenTelemetry Viewer"
  >
    <SetupGuide />

    <template #footer="{ close }">
      <div class="flex justify-end">
        <button
          @click="close"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded transition-colors"
        >
          Got it
        </button>
      </div>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
const dialogRef = useTemplateRef('dialog');

function open() {
  dialogRef.value?.open();
}

function close() {
  dialogRef.value?.close();
}

defineExpose({ open, close });
</script>
