<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header
      class="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center"
    >
      <div class="flex items-center gap-3">
        <img src="/logo.svg" alt="Teley Logo" class="w-10 h-10" />
        <h1 class="text-xl font-semibold text-zinc-100">
          Teley
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <!-- Session indicator -->
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

        <!-- Export / Import / Clear -->
        <div class="flex items-center gap-1">
          <button
            @click="handleExport"
            class="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
            title="Export data"
          >
            <IconPhDownloadSimple class="w-4 h-4" />
          </button>
          <button
            @click="fileInput?.click()"
            class="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
            title="Import data"
          >
            <IconPhUploadSimple class="w-4 h-4" />
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleImport"
          />
          <ClearDataButton />
        </div>

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
      </div>
    </header>

    <!-- Service Filter -->
    <ServiceFilterBar v-if="hasMultipleServices" />

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
import IconPhDownloadSimple from '~icons/ph/download-simple';
import IconPhUploadSimple from '~icons/ph/upload-simple';
import { exportAllData, importAllData } from './database/operations';

const { roomId, receiveToken, isNewSession, initialized: sessionInitialized, initialize: initSession } = useSession();
const { connected: relayConnected, initialize: initRelay, connect: connectRelay } = useRelay();
const { initialize: initDataSync } = useDataSync();
const { hasMultipleServices } = useServiceFilter();

// Initialize hash tabs
useHashTabs();

const showSetupModal = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
});

// Connect when credentials are available
watch([roomId, receiveToken], ([newRoomId, newToken]) => {
  if (newRoomId && newToken) {
    connectRelay(newRoomId, newToken);
  }
}, { immediate: true });

const handleSetupModalClose = () => {
  showSetupModal.value = false;
};

const handleExport = async () => {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teley-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);
  await importAllData(data);

  // Reset file input so the same file can be re-imported
  if (fileInput.value) fileInput.value.value = '';

  // Reload to reflect imported data
  window.location.reload();
};
</script>
