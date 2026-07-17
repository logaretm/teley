<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
    class="flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm cursor-pointer transition-colors"
    :class="modelValue ? 'text-zinc-100 bg-zinc-700/50' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/30'"
  >
    <span
      class="flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0"
      :class="modelValue
        ? 'bg-blue-500 border-blue-500'
        : 'border-zinc-600 bg-zinc-900'"
    >
      <IconPhCheck v-if="modelValue" class="w-3 h-3 text-white" />
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>
