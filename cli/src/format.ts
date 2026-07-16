// Formatting helpers. Ported from app/utils/formatters.ts.

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// OTLP span kind numbering: 1=Internal 2=Server 3=Client 4=Producer 5=Consumer
const KIND_LABEL: Record<number, string> = {
  1: 'Internal',
  2: 'Server',
  3: 'Client',
  4: 'Producer',
  5: 'Consumer',
};

export function spanKindLabel(kind: number): string {
  return KIND_LABEL[kind] ?? 'Internal';
}

// Single-letter badge (P is Producer; Consumer shows N to disambiguate from Client)
export function spanKindBadge(kind: number): string {
  if (kind === 5) return 'N';
  return spanKindLabel(kind)[0]!;
}

export function statusLabel(code: number): string {
  return code === 2 ? 'ERROR' : 'OK';
}

export function truncate(str: string, max: number): string {
  if (max <= 0) return '';
  if (str.length <= max) return str;
  if (max <= 1) return str.slice(0, max);
  return str.slice(0, max - 1) + '…';
}
