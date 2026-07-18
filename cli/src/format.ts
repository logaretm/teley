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

// Log severity mapping (OTLP spec: severity numbers 1-24). Ported from the web app.
export function severityLabel(
  severityNumber: number,
  severityText?: string | null,
): string {
  if (severityText) return severityText.toUpperCase();
  if (severityNumber >= 21) return 'FATAL';
  if (severityNumber >= 17) return 'ERROR';
  if (severityNumber >= 13) return 'WARN';
  if (severityNumber >= 9) return 'INFO';
  if (severityNumber >= 5) return 'DEBUG';
  if (severityNumber >= 1) return 'TRACE';
  return 'UNSET';
}

// Clock time for the log stream: HH:MM:SS.mmm (local).
export function formatLogTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

// Strip ANSI escape sequences so control codes don't corrupt the terminal render.
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;
export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

export function truncate(str: string, max: number): string {
  if (max <= 0) return '';
  if (str.length <= max) return str;
  if (max <= 1) return str.slice(0, max);
  return str.slice(0, max - 1) + '…';
}

// Greedy word wrap to a column width, hard-splitting words longer than the width.
export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (word.length > width) {
        if (line) {
          lines.push(line);
          line = '';
        }
        for (let i = 0; i < word.length; i += width)
          lines.push(word.slice(i, i + width));
        continue;
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Render an attribute value as a single-line string for display.
export function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
