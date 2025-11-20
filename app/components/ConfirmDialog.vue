<template>
  <ModalDialog ref="dialog" :title="title" :show-close="showClose">
    {{ description }}

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="handleCancel"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          class="px-4 py-2 text-sm font-medium rounded transition-colors"
          :class="confirmButtonClass"
        >
          {{ confirmText }}
        </button>
      </div>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  showClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  description: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'primary',
  showClose: true,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const dialogRef = useTemplateRef('dialog');

const confirmButtonClass = computed(() => {
  return props.variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';
});

function open() {
  dialogRef.value?.open();
}

function close() {
  dialogRef.value?.close();
}

function handleConfirm() {
  emit('confirm');
  close();
}

function handleCancel() {
  emit('cancel');
  close();
}

defineExpose({ open, close });
</script>
