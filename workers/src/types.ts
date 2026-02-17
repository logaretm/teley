// Cloudflare Worker environment bindings

export interface Env {
  TELEMETRY_ROOM: DurableObjectNamespace;
  SHARED_TRACE: DurableObjectNamespace;
  ASSETS?: Fetcher; // Optional - only available in production with assets binding
}

export interface Session {
  id: string;
  ws: WebSocket;
}
