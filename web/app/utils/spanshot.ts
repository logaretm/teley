// Open a trace in Spanshot (https://spanshot.dev). We convert our parsed
// Trace/Span[] into Spanshot's native span format and encode it into the URL
// hash format Spanshot decodes: JSON -> gzip (Compression Streams API) ->
// url-safe base64, prefixed with a 1-char scheme tag ('g' gzip, 'u' plain).

import type { Trace, Span } from '@types';

const SPANSHOT_ORIGIN = 'https://spanshot.dev';

interface SpanshotSpan {
  id: string;
  name: string;
  lib: string;
  parentId: string | null;
  start: number;
  end: number;
  kind: number;
  status: { code: number; message: string | null };
  service?: string;
  attributes?: Record<string, unknown>;
}

interface ShareState {
  input: string;
  theme: number;
  title: string;
  mode: 'dark' | 'light';
}

// OTLP wire SpanKind -> a stable grouping label (used as a color-group fallback).
const KIND_LABEL: Record<number, string> = {
  0: 'unspecified',
  1: 'internal',
  2: 'server',
  3: 'client',
  4: 'producer',
  5: 'consumer',
};

function shortScope(s: string): string {
  return s
    .replace(/^@opentelemetry\/instrumentation-/, '')
    .replace(/^@opentelemetry\//, '')
    .replace(/^opentelemetry\.instrumentation\./, '');
}

// Spanshot colors by `lib`. Prefer the Sentry op category, then the OTel
// instrumentation scope, then the span kind — so spans group meaningfully.
function deriveLib(span: Span): string {
  const a = (span.attributes ?? {}) as Record<string, unknown>;
  const op = a['sentry.op'];
  if (typeof op === 'string' && op) return op.split('.')[0]!;
  const scope = a['otel.scope.name'] ?? a['otel.library.name'];
  if (typeof scope === 'string' && scope) return shortScope(scope);
  return KIND_LABEL[span.kind] ?? 'span';
}

function buildPayload(trace: Trace, spans: Span[]): SpanshotSpan[] {
  return spans.map((s) => ({
    id: s.span_id,
    name: s.name,
    lib: deriveLib(s),
    parentId: s.parent_span_id ?? null,
    start: s.start_time,
    end: s.end_time,
    kind: s.kind,
    status: { code: s.status_code, message: s.status_message },
    service: trace.service_name,
    attributes: s.attributes,
  }));
}

// --- hash encoding (mirrors spanshot's share.ts) ---------------------------
function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
async function gzip(str: string): Promise<Uint8Array> {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function encodeState(state: ShareState): Promise<string> {
  const json = JSON.stringify(state);
  if (typeof CompressionStream !== 'undefined') {
    return 'g' + toUrlSafe(bytesToB64(await gzip(json)));
  }
  return 'u' + toUrlSafe(btoa(unescape(encodeURIComponent(json))));
}

/**
 * Open the given trace in Spanshot in a new tab. The blank window is opened
 * synchronously (popup-blocker friendly) and navigated once the (async) hash
 * is built.
 */
export async function openInSpanshot(trace: Trace, spans: Span[]): Promise<void> {
  const win = window.open('about:blank', '_blank');
  try {
    const state: ShareState = {
      input: JSON.stringify(buildPayload(trace, spans), null, 2),
      theme: 0,
      title: trace.operation_name || trace.service_name || 'trace',
      mode: 'dark',
    };
    const url = `${SPANSHOT_ORIGIN}/#${await encodeState(state)}`;
    if (win) win.location.replace(url);
    else window.open(url, '_blank');
  } catch (err) {
    console.error('Failed to open trace in Spanshot:', err);
    win?.close();
  }
}
