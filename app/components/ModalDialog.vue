<template>
  <dialog
    ref="dialog"
    class="backdrop:bg-black/50 p-0 bg-transparent w-full h-full"
    @click="handleBackdropClick"
  >
    <div class="flex items-center justify-center h-full w-full">
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-max shrink-0 max-h-[90vh] overflow-y-auto relative"
      >
        <!-- Header -->
        <div
          class="flex items-start justify-between mb-4 sticky top-0 bg-zinc-900 z-10 p-4 border-b border-zinc-800"
        >
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-zinc-100 mb-1">
              <slot name="title">{{ title }}</slot>
            </h2>
            <p
              v-if="description || $slots.description"
              class="text-sm text-zinc-400"
            >
              <slot name="description">{{ description }}</slot>
            </p>
          </div>
          <button
            v-if="showClose"
            @click="close"
            class="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors ml-4"
          >
            <IconPhXBold class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="text-zinc-300 px-6 pb-6">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="p-3">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  showClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  showClose: true,
});

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
dialog {
  transition:
    display 0.2s allow-discrete,
    overlay 0.2s allow-discrete,
    opacity 0.2s allow-discrete ease-in-out,
    transform 0.2s allow-discrete ease-in-out;

  opacity: 0;
  transform: scale(0.95);
  transform-origin: center;

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    transition:
      display 0.2s allow-discrete,
      overlay 0.2s allow-discrete,
      opacity 0.2s allow-discrete ease-in-out;
    opacity: 0;
  }

  &[open] {
    opacity: 1;
    transform: scale(1);

    &::backdrop {
      opacity: 1;
    }

    @starting-style {
      opacity: 0;
      transform: scale(0.95);

      &::backdrop {
        opacity: 0;
      }
    }
  }
}
</style>
