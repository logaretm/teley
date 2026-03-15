// Durable Object for storing shared trace snapshots with 24h TTL

import type { Env } from './types';

export class SharedTrace implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/store' && request.method === 'POST') {
      const data = await request.json();
      await this.state.storage.put('snapshot', data);
      // Set 24h TTL alarm
      await this.state.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
      return new Response('OK');
    }

    if (url.pathname === '/retrieve' && request.method === 'GET') {
      const snapshot = await this.state.storage.get('snapshot');
      if (!snapshot) {
        return new Response('Not Found', { status: 404 });
      }
      return new Response(JSON.stringify(snapshot), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  async alarm(): Promise<void> {
    await this.state.storage.deleteAll();
  }
}
