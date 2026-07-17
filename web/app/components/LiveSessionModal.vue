<template>
  <ModalDialog :open="open" @close="$emit('close')">
    <template #title>Go Live</template>
    <template #content>
      <div class="space-y-4">
        <p class="text-sm text-zinc-400">
          Share this URL so others can watch your telemetry stream in real-time.
        </p>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-300">
            Live Session URL
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="liveUrl"
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
            />
            <button
              @click="copyToClipboard"
              class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              :class="copied ? 'text-emerald-400' : 'text-zinc-300'"
            >
              <IconMdiContentCopy v-if="!copied" class="w-4 h-4" />
              <IconMdiCheck v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-zinc-500">
            Link is active as long as your session is open
          </p>
        </div>
      </div>
    </template>
    <template #actions>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
      >
        Done
      </button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import IconMdiContentCopy from '~icons/mdi/content-copy';
import IconMdiCheck from '~icons/mdi/check';

const props = defineProps<{
  open: boolean;
  roomId: string;
  receiveToken: string;
}>();

defineEmits<{
  close: [];
}>();

const copied = ref(false);

const liveUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/live/${props.roomId}?token=${props.receiveToken}`;
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(liveUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
</script>
