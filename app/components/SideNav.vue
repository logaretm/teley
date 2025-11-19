<template>
  <nav
    class="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4"
  >
    <NuxtLink
      to="/"
      class="nav-item"
      :class="{ active: currentRoute === '/' }"
      title="Traces"
    >
      <IconPhChartBarHorizontal class="w-6 h-6" />
    </NuxtLink>

    <NuxtLink
      to="/logs"
      class="nav-item"
      :class="{ active: currentRoute === '/logs' }"
      title="Logs"
    >
      <IconPhLog class="w-6 h-6" />
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const currentRoute = computed(() => route.path);
</script>

<style scoped>
@reference '../../app/assets/css/main.css';

.nav-item {
  @apply w-12 h-12 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors mb-2;
}

.nav-item.active {
  @apply text-blue-400 bg-zinc-800;
}
</style>
