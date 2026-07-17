<template>
  <div class="bg-zinc-900 border-b border-zinc-800 px-6 py-2 flex items-center gap-2 text-sm">
    <span class="text-zinc-500 text-xs font-medium shrink-0">Services</span>
    <div class="flex items-center gap-1.5 flex-wrap">
      <button
        v-for="service in availableServices"
        :key="service"
        @click="toggleService(service)"
        class="px-2.5 py-0.5 rounded-full border text-xs font-medium transition-colors"
        :class="selectedServices.has(service)
          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
          : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'"
      >
        {{ service }}
      </button>
    </div>
    <div class="flex items-center gap-1 ml-auto shrink-0">
      <button
        @click="selectAll"
        class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
      >
        All
      </button>
      <button
        @click="deselectAll"
        class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
      >
        None
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { availableServices, selectedServices, toggleService, selectAll, deselectAll } = useServiceFilter();
</script>
