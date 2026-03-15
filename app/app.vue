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
      <div class="flex items-center gap-2">
        <!-- Session indicator (owner only) -->
        <button
          v-if="!isViewerRoute && sessionInitialized && roomId"
          @click="showSetupModal = true"
          class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded"
          title="View setup instructions"
        >
          <IconPhGear class="w-4 h-4" />
          <span class="font-mono text-xs">
            {{ roomId }}
          </span>
        </button>

        <!-- Go Live button (owner only) -->
        <button
          v-if="!isViewerRoute && sessionInitialized && roomId"
          @click="showLiveModal = true"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <IconPhBroadcastBold class="w-3.5 h-3.5" />
          Go Live
          <span
            v-if="viewerCount > 1"
            class="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400"
          >
            {{ viewerCount }}
          </span>
        </button>

        <!-- Viewer count (viewer routes) -->
        <span
          v-if="isViewerRoute && viewerCount > 1"
          class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-400"
        >
          <IconPhBroadcastBold class="w-3.5 h-3.5" />
          {{ viewerCount }} viewing
        </span>

        <!-- Export / Import / Clear (owner only) -->
        <div v-if="!isViewerRoute" class="flex items-center gap-1">
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
          class="flex items-center gap-2 text-sm group relative"
          :title="relayConnected ? 'Connected' : 'Disconnected'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="
              relayConnected
                ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-zinc-500'
            "
          ></span>
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

    <!-- Live Session Modal -->
    <LiveSessionModal
      :open="showLiveModal"
      :room-id="roomId || ''"
      :receive-token="receiveToken || ''"
      @close="showLiveModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import IconPhDownloadSimple from '~icons/ph/download-simple';
import IconPhUploadSimple from '~icons/ph/upload-simple';
import IconPhBroadcastBold from '~icons/ph/broadcast-bold';
import { exportAllData, importAllData } from './database/operations';
import { onViewerCount } from './composables/useDataSync';

const route = useRoute();
const { roomId, receiveToken, isNewSession, initialized: sessionInitialized, initialize: initSession } = useSession();
const { connected: relayConnected, initialize: initRelay, connect: connectRelay } = useRelay();
const { initialize: initDataSync } = useDataSync();
const { hasMultipleServices } = useServiceFilter();

// Initialize hash tabs
useHashTabs();

const showSetupModal = ref(false);
const showLiveModal = ref(false);
const viewerCount = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);

const isViewerRoute = computed(() =>
  route.path.startsWith('/live/') || route.path.startsWith('/shared/')
);

// Subscribe to viewer count updates
onViewerCount((count) => {
  viewerCount.value = count;
});

// Initialize session and relay on mount
onMounted(async () => {
  // Initialize relay worker (must happen before connect)
  initRelay();

  // Initialize data sync (saves incoming data to IndexedDB)
  initDataSync();

  // Initialize session (loads or creates credentials)
  await initSession();

  // Connect now that relay is initialized and credentials are available
  // (handles case where credentials were set before mount, e.g. live page)
  if (roomId.value && receiveToken.value) {
    connectRelay(roomId.value, receiveToken.value);
  }

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
});

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
