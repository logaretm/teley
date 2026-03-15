// SharedWorker for managing WebSocket connection across browser tabs
// This ensures only one WebSocket connection per room, with data fan-out to all tabs

console.log('[RelayWorker] SharedWorker script loaded');

interface State {
  roomId: string | null;
  receiveToken: string | null;
  wsUrl: string | null;
  ws: WebSocket | null;
  ports: Set<MessagePort>;
  status: 'disconnected' | 'connecting' | 'connected';
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

const state: State = {
  roomId: null,
  receiveToken: null,
  wsUrl: null,
  ws: null,
  ports: new Set(),
  status: 'disconnected',
  reconnectTimer: null,
};

console.log('[RelayWorker] Initial state created');

// SharedWorker global context
declare const self: SharedWorkerGlobalScope;

self.onconnect = (e: MessageEvent) => {
  console.log('[RelayWorker] onconnect event received');
  const port = e.ports[0];
  if (!port) {
    console.error('[RelayWorker] No port in connect event');
    return;
  }

  console.log('[RelayWorker] New port connected, total ports:', state.ports.size + 1);
  state.ports.add(port);

  port.onmessage = (event) => {
    console.log('[RelayWorker] Message received from port:', event.data);
    handleMessage(port, event.data);
  };
  port.start();

  // Send current state to new tab
  console.log('[RelayWorker] Sending initial status to new port:', state.status);
  port.postMessage({ type: 'status', status: state.status });
  if (state.roomId) {
    port.postMessage({
      type: 'credentials',
      roomId: state.roomId,
      receiveToken: state.receiveToken,
    });
  }
};

function handleMessage(port: MessagePort, msg: any) {
  switch (msg.type) {
    case 'connect':
      connect(msg.roomId, msg.receiveToken, msg.wsUrl);
      break;

    case 'disconnect':
      disconnect();
      break;

    case 'get-credentials':
      if (state.roomId) {
        port.postMessage({
          type: 'credentials',
          roomId: state.roomId,
          receiveToken: state.receiveToken,
        });
      }
      break;

    case 'port-closing':
      state.ports.delete(port);
      // If no more ports and disconnected, clean up
      if (state.ports.size === 0 && state.status === 'disconnected') {
        cleanup();
      }
      break;
  }
}

function connect(roomId: string, receiveToken: string, wsUrl: string) {
  console.log('[RelayWorker] connect() called with wsUrl:', wsUrl);

  // If already connected to same room, no-op
  if (state.roomId === roomId && state.status === 'connected') {
    return;
  }

  // Clean up existing connection if different room
  if (state.ws && state.roomId !== roomId) {
    state.ws.close();
    state.ws = null;
  }

  state.roomId = roomId;
  state.receiveToken = receiveToken;
  state.wsUrl = wsUrl;
  state.status = 'connecting';
  broadcast({ type: 'status', status: 'connecting' });

  // Clear any pending reconnect
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  try {
    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
      state.status = 'connected';
      broadcast({ type: 'status', status: 'connected' });
      broadcast({
        type: 'credentials',
        roomId: state.roomId,
        receiveToken: state.receiveToken,
      });
    };

    state.ws.onmessage = (e) => {
      try {
        // Handle pong messages
        if (e.data === 'pong') {
          return;
        }

        const payload = JSON.parse(e.data);
        broadcast({ type: 'data', payload });
      } catch (err) {
        console.error('[RelayWorker] Failed to parse message:', err);
      }
    };

    state.ws.onclose = (e) => {
      state.status = 'disconnected';
      state.ws = null;
      broadcast({ type: 'status', status: 'disconnected' });

      // Auto-reconnect after 3s if there are still connected ports and we have credentials
      if (state.ports.size > 0 && state.roomId && state.receiveToken && state.wsUrl) {
        state.reconnectTimer = setTimeout(() => {
          if (state.ports.size > 0 && state.roomId && state.receiveToken && state.wsUrl) {
            connect(state.roomId, state.receiveToken, state.wsUrl);
          }
        }, 3000);
      }
    };

    state.ws.onerror = (error) => {
      console.error('[RelayWorker] WebSocket error:', error);
    };

    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send('ping');
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  } catch (error) {
    console.error('[RelayWorker] Failed to create WebSocket:', error);
    state.status = 'disconnected';
    broadcast({ type: 'status', status: 'disconnected' });
  }
}

function disconnect() {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }

  state.status = 'disconnected';
  broadcast({ type: 'status', status: 'disconnected' });
}

function cleanup() {
  disconnect();
  state.roomId = null;
  state.receiveToken = null;
}

function broadcast(msg: any) {
  const deadPorts: MessagePort[] = [];

  for (const port of state.ports) {
    try {
      port.postMessage(msg);
    } catch {
      deadPorts.push(port);
    }
  }

  // Clean up dead ports
  for (const port of deadPorts) {
    state.ports.delete(port);
  }
}
