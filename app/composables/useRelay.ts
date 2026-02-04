// Composable for relay communication via SharedWorker

import type { WebSocketMessage } from '../../shared/parsers/types';

type RelayStatus = 'disconnected' | 'connecting' | 'connected';

// Module-level state
let _worker: SharedWorker | null = null;
let _port: MessagePort | null = null;

// Event emitter for data updates
const dataCallbacks = new Set<(data: WebSocketMessage) => void>();

export function useRelay() {
  const status = useState<RelayStatus>('relay-status', () => 'disconnected');

  const connected = computed(() => status.value === 'connected');

  const initialize = (): void => {
    if (_worker) {
      console.log('[Relay] Already initialized');
      return;
    }

    console.log('[Relay] Initializing...');

    if (typeof SharedWorker === 'undefined') {
      console.error('[Relay] SharedWorker is not supported in this browser');
      return;
    }

    try {
      _worker = new SharedWorker(
        new URL('../workers/relay-worker.ts', import.meta.url),
        { type: 'module', name: 'otel-relay' }
      );
      console.log('[Relay] SharedWorker created');

      _port = _worker.port;

      _port.onmessage = (event) => {
        console.log('[Relay] Message from worker:', event.data);
        handleWorkerMessage(event.data, status);
      };

      _worker.onerror = (error) => {
        console.error('[Relay] SharedWorker error:', error);
      };

      _port.start();
      console.log('[Relay] Port started');

      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          _port?.postMessage({ type: 'port-closing' });
        });
      }
    } catch (error) {
      console.error('[Relay] Failed to create SharedWorker:', error);
    }
  };

  const connect = (roomId: string, receiveToken: string): void => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/r/${roomId}?token=${receiveToken}`;

    console.log('[Relay] connect() called');
    console.log('[Relay] roomId:', roomId);
    console.log('[Relay] receiveToken:', receiveToken);
    console.log('[Relay] wsUrl:', wsUrl);
    console.log('[Relay] _port:', _port);

    if (!_port) {
      console.error('[Relay] Cannot connect - port not initialized');
      return;
    }

    const message = {
      type: 'connect',
      roomId,
      receiveToken,
      wsUrl,
    };
    console.log('[Relay] Sending connect message to worker:', message);
    _port.postMessage(message);
  };

  const disconnect = (): void => {
    console.log('[Relay] disconnect() called');
    _port?.postMessage({ type: 'disconnect' });
  };

  const onData = (callback: (data: WebSocketMessage) => void): (() => void) => {
    dataCallbacks.add(callback);
    return () => dataCallbacks.delete(callback);
  };

  return {
    status: readonly(status),
    connected,
    initialize,
    connect,
    disconnect,
    onData,
  };
}

function handleWorkerMessage(msg: any, status: Ref<RelayStatus>) {
  console.log('[Relay] handleWorkerMessage:', msg.type, msg);

  switch (msg.type) {
    case 'status':
      console.log('[Relay] Status update:', msg.status);
      status.value = msg.status;
      break;

    case 'credentials':
      console.log('[Relay] Credentials received from SharedWorker');
      break;

    case 'data':
      console.log('[Relay] Data received, broadcasting to', dataCallbacks.size, 'callbacks');
      console.log('[Relay] Data payload:', msg.payload);
      // Broadcast to all registered callbacks
      for (const callback of dataCallbacks) {
        try {
          callback(msg.payload);
        } catch (err) {
          console.error('[Relay] Error in data callback:', err);
        }
      }
      break;

    default:
      console.log('[Relay] Unknown message type:', msg.type);
  }
}
