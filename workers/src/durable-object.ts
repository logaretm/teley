// Durable Object for managing telemetry room state and WebSocket connections

import type { Env } from './types';

export class TelemetryRoom implements DurableObject {
  private receiveToken: string | null = null;
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Restore token from storage
    this.state.blockConcurrencyWhile(async () => {
      this.receiveToken = await this.state.storage.get<string>('receiveToken') ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal broadcast from main worker
    if (url.pathname === '/broadcast') {
      const data = await request.json();
      this.broadcast(data);
      await this.resetAlarm();
      return new Response('OK');
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    console.log('[DO] WebSocket upgrade request, token:', token ? 'present' : 'missing');

    if (!token) {
      return new Response('Missing token', { status: 400 });
    }

    // First connection claims the room
    if (!this.receiveToken) {
      console.log('[DO] First connection, claiming room with token');
      this.receiveToken = token;
      await this.state.storage.put('receiveToken', token);
    }

    // Validate token
    if (token !== this.receiveToken) {
      console.log('[DO] Token mismatch, rejecting');
      return new Response('Unauthorized', { status: 401 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket with hibernation support
    this.state.acceptWebSocket(server);
    console.log('[DO] WebSocket accepted, total sockets:', this.state.getWebSockets().length);

    server.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to room',
    }));

    await this.resetAlarm();

    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(data: any): void {
    const message = JSON.stringify(data);

    // Use getWebSockets() for hibernation-compatible WebSocket access
    const sockets = this.state.getWebSockets();
    console.log('[DO] Broadcasting to', sockets.length, 'sockets:', data.type);

    for (const ws of sockets) {
      try {
        ws.send(message);
      } catch (error) {
        console.error('[DO] Failed to send to socket:', error);
      }
    }
  }

  private async resetAlarm(): Promise<void> {
    // Set alarm for 30 minutes from now
    await this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000);
  }

  async alarm(): Promise<void> {
    // Check if there are any active sessions
    const sockets = this.state.getWebSockets();
    console.log('[DO] Alarm fired, active sockets:', sockets.length);

    if (sockets.length === 0) {
      // No active sessions, clean up the room
      console.log('[DO] No active sockets, cleaning up room');
      await this.state.storage.deleteAll();
      return;
    }

    // There are active sessions, extend the alarm
    await this.resetAlarm();
  }

  // WebSocket event handlers for hibernation
  webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): void {
    // Handle ping/pong for keepalive
    if (message === 'ping') {
      ws.send('pong');
    }
  }

  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    console.log('[DO] WebSocket closed, code:', code, 'reason:', reason);
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    console.error('[DO] WebSocket error:', error);
  }
}
