// Generic WebSocket composable - handles connection only
import { useWebSocket as useVueUseWebSocket } from '@vueuse/core';
import { computed, type Ref, type ComputedRef } from 'vue';

interface WebSocketInstance {
  connect: () => void;
  disconnect: () => void;
  connected: ComputedRef<boolean>;
  data: Ref<string | null>;
  send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
}

let wsInstance: WebSocketInstance | null = null;

export const useWebSocket = (): WebSocketInstance => {
  // Return existing instance if already created
  if (wsInstance) {
    return wsInstance;
  }

  const protocol =
    typeof window !== 'undefined'
      ? window.location.protocol === 'https:'
        ? 'wss:'
        : 'ws:'
      : 'ws:';

  const wsUrl =
    typeof window !== 'undefined'
      ? `${protocol}//${window.location.host}/_ws`
      : '';

  const { status, data, send, open, close } = useVueUseWebSocket(wsUrl, {
    immediate: true,
    autoReconnect: {
      retries: 10,
      delay: 3000,
      onFailed() {
        console.error('[WebSocket] Failed to reconnect after 10 attempts');
      },
    },
    heartbeat: {
      message: 'ping',
      interval: 30000,
      pongTimeout: 10000,
    },
    onConnected: () => {
      console.log('[WebSocket] Connected');
    },
    onDisconnected: () => {
      console.log('[WebSocket] Disconnected');
    },
    onError: (event) => {
      console.error('[WebSocket] Error:', event);
    },
  });

  const connected = computed(() => status.value === 'OPEN');

  wsInstance = {
    connect: open,
    disconnect: close,
    connected,
    data,
    send,
  };

  return wsInstance;
};
