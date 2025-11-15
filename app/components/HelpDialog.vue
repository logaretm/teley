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
            <IconPhXBold class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <SetupGuide />

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
