<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header
      class="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center"
    >
      <div class="flex items-center gap-3">
        <img src="/logo.svg" alt="OTel Viewer Logo" class="w-10 h-10" />
        <h1 class="text-xl font-semibold text-zinc-100">
          OpenTelemetry Viewer
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <div
          class="flex items-center gap-2 text-sm"
          :class="wsConnected ? 'text-green-400' : 'text-zinc-500'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="
              wsConnected
                ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-zinc-500'
            "
          ></span>
          {{ wsConnected ? 'Connected' : 'Disconnected' }}
        </div>
        <div class="flex items-center gap-2 text-sm text-zinc-400">
          <span>Live</span>
          <ToggleSwitch v-model="liveMode" />
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Side Navigation -->
      <SideNav />

      <!-- Main Content Area -->
      <NuxtPage />
    </div>

    <HelpDialog ref="helpDialog" />
    <ConfirmDialog
      ref="confirmDialog"
      title="Clear All Traces"
      description="Are you sure you want to clear all trace data? This action cannot be undone."
      confirm-text="Clear All"
      cancel-text="Cancel"
      variant="danger"
      @confirm="confirmClearData"
    />
  </div>
</template>

<script setup lang="ts">
import ConfirmDialog from './components/ConfirmDialog.vue';

const { connected: wsConnected } = useWebSocket();
const { clearAllTraces } = useTraces();
const { liveMode } = useLiveMode();
const helpDialog = ref<{ open: () => void; close: () => void } | null>(null);
const confirmDialog = ref<{ open: () => void; close: () => void } | null>(null);

// Provide live mode state to child components
provide('liveMode', liveMode);
provide('helpDialog', helpDialog);
provide('confirmDialog', confirmDialog);

async function confirmClearData() {
  await clearAllTraces();
}
</script>
