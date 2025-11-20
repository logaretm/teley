import ConfirmDialog, {
  type Props as ConfirmDialogProps,
} from '@/components/ConfirmDialog.vue';

export function useConfirmation(onConfirm: () => void) {
  const dynamicProps = ref<Pick<ConfirmDialogProps, 'title' | 'description'>>({
    title: '',
    description: '',
  });

  const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>();

  const onConfirmClose = () => {
    onConfirm();
    confirmDialog.value?.close();
  };

  function setRef(ref: any) {
    confirmDialog.value = ref;
  }

  const Dialog = defineComponent((props: ConfirmDialogProps, { slots }) => {
    return () =>
      h(
        ConfirmDialog,
        {
          ...dynamicProps.value,
          ...props,
          ref: setRef,
          onConfirm: onConfirmClose,
        },
        slots,
      );
  });

  function triggerConfirm(title: string, description?: string) {
    dynamicProps.value = {
      title,
      description,
    };

    confirmDialog.value?.open();
  }

  return [Dialog, triggerConfirm] as const;
}
