<template>
  <div class="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
    <!-- Header -->
    <div class="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold text-zinc-100">Logs</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Real-time log monitoring (showing last 500 logs)
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-zinc-400">
            {{ logs.length }} {{ logs.length === 1 ? 'log' : 'logs' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center space-y-3">
          <div
            class="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto"
          ></div>
          <p class="text-sm text-zinc-400">Loading logs...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div
          class="text-center space-y-3 max-w-md px-8 py-6 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>
      </div>

      <div
        v-else-if="logs.length === 0"
        class="flex items-center justify-center h-full"
      >
        <div class="text-center space-y-6 max-w-md px-8">
          <div
            class="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950"
            />
            <IconPhLog class="w-16 h-16 text-zinc-700 relative z-10" />
          </div>
          <div class="space-y-3">
            <h3 class="text-xl font-semibold text-zinc-300">No logs yet</h3>
            <p class="text-sm text-zinc-500 leading-relaxed">
              Logs will appear here as they are received via OTLP
            </p>
          </div>
        </div>
      </div>

      <table v-else class="w-full">
        <tbody>
          <LogRow
            v-for="log in logs"
            :key="log.log_id"
            :log="log"
            :is-expanded="expandedLogs.has(log.log_id)"
            @toggle-expanded="toggleLogExpansion(log.log_id)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { logs, loading, error, fetchLogs } = useLogs();

const expandedLogs = ref<Set<string>>(new Set());

function toggleLogExpansion(logId: string) {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId);
  } else {
    expandedLogs.value.add(logId);
  }
}

// Fetch logs on mount
onMounted(() => {
  fetchLogs();
});
</script>
