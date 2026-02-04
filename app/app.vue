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
        <!-- Room indicator -->
        <button
          v-if="sessionInitialized && roomId"
          @click="showSetupModal = true"
          class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded"
          title="View setup instructions"
        >
          <IconPhGear class="w-4 h-4" />
          <span class="font-mono text-xs">
            {{ roomId }}
          </span>
        </button>

        <div
          class="flex items-center gap-2 text-sm"
          :class="relayConnected ? 'text-green-400' : 'text-zinc-500'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="
              relayConnected
                ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-zinc-500'
            "
          ></span>
          {{ relayConnected ? 'Connected' : 'Disconnected' }}
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

    <!-- Setup Modal -->
    <SetupModal
      :open="showSetupModal"
      :room-id="roomId || ''"
      @close="handleSetupModalClose"
    />
  </div>
</template>

<script setup lang="ts">
const { liveMode } = useLiveMode();
const { roomId, receiveToken, isNewSession, initialized: sessionInitialized, initialize: initSession } = useSession();
const { connected: relayConnected, initialize: initRelay, connect: connectRelay } = useRelay();
const { initialize: initDataSync } = useDataSync();

// Initialize hash tabs
useHashTabs();

const showSetupModal = ref(false);

// Initialize session and relay on mount
onMounted(async () => {
  // Initialize relay worker
  initRelay();

  // Initialize data sync (saves incoming data to IndexedDB)
  initDataSync();

  // Initialize session (loads or creates credentials)
  await initSession();

  // Show setup modal for new sessions
  if (isNewSession.value) {
    showSetupModal.value = true;
  }

  // Connect to relay with credentials
  if (roomId.value && receiveToken.value) {
    connectRelay(roomId.value, receiveToken.value);
  }
});

// Watch for session changes to reconnect
watch([roomId, receiveToken], ([newRoomId, newToken]) => {
  if (newRoomId && newToken) {
    connectRelay(newRoomId, newToken);
  }
});

const handleSetupModalClose = () => {
  showSetupModal.value = false;
};
</script>
