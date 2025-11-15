<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    @click="modelValue = !modelValue"
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900 bg-zinc-800 aria-checked:bg-black"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full transition-transform"
      :class="[
        modelValue ? 'translate-x-6 bg-zinc-200' : 'translate-x-1 bg-zinc-600',
      ]"
    ></span>
  </button>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>({ required: true });
</script>
