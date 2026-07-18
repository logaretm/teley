import type { TraceEntry } from '../types';
import { UI, ERROR_RED, OK_GREEN, BOLD, depthColor } from '../theme';
import { buildSpanTree } from '../span-tree';
import {
  formatDuration,
  spanKindBadge,
  statusLabel,
  truncate,
} from '../format';

interface Props {
  trace: TraceEntry;
  width: number;
  height: number; // rows available for this panel (incl. border)
  focused: boolean;
  selectedSpanId: string | null;
}

const NAME_COL = 32;

const GUTTER = 2; // leading "▸ " selection marker column

export function Waterfall({
  trace,
  width,
  height,
  focused,
  selectedSpanId,
}: Props) {
  const inner = width - 4; // borders + padding
  const nameCol = Math.max(12, Math.min(NAME_COL, Math.floor(inner * 0.5)));
  const timelineWidth = Math.max(4, inner - GUTTER - nameCol - 1);

  const nodes = buildSpanTree(trace.spans, trace.trace);
  const isErr = trace.trace.status_code === 2;
  const scaleLabels = timeScale(trace.trace.duration, timelineWidth);

  // Window the span rows so the selected span stays visible in deep traces.
  // Overhead: border (2) + meta line (1) + time-scale block (2).
  const selectedIndex = Math.max(
    0,
    nodes.findIndex((n) => n.span.span_id === selectedSpanId),
  );
  const visible = Math.max(1, height - 5);
  const start =
    selectedIndex < visible
      ? 0
      : Math.min(
          selectedIndex - visible + 1,
          Math.max(0, nodes.length - visible),
        );
  const shown = nodes.slice(start, start + visible);

  return (
    <box
      style={{
        flexDirection: 'column',
        flexGrow: 1,
        border: true,
        borderColor: focused ? UI.borderActive : UI.border,
        backgroundColor: UI.bg,
        paddingLeft: 1,
        paddingRight: 1,
      }}
      title={` ${truncate(trace.trace.operation_name, Math.max(4, inner - 2))} `}
    >
      {/* Meta line. Composed as one truncated string so it never wraps; the
          status keeps its own color on the right. */}
      <box style={{ flexDirection: 'row' }}>
        <text fg={UI.dim}>
          {truncate(
            `${trace.trace.service_name}  ·  ${formatDuration(trace.trace.duration)}  ·  ${trace.spans.length} spans  ·  ${trace.trace.source}`,
            Math.max(
              4,
              inner - statusLabel(trace.trace.status_code).length - 1,
            ),
          )}
        </text>
        <box style={{ flexGrow: 1 }} />
        <text fg={isErr ? ERROR_RED : OK_GREEN} attributes={BOLD}>
          {statusLabel(trace.trace.status_code)}
        </text>
      </box>

      {/* Time scale */}
      <box style={{ flexDirection: 'row', marginTop: 1 }}>
        <box style={{ width: GUTTER + nameCol }} />
        <text fg={UI.dim}>{scaleLabels}</text>
      </box>

      {/* Spans */}
      {shown.map((node) => {
        const { span, depth } = node;
        const isSel = focused && span.span_id === selectedSpanId;
        const color = depthColor(depth, span.status_code);
        const indent = '  '.repeat(depth);
        const badge = spanKindBadge(span.kind);
        const dur = formatDuration(span.duration);
        const nameMax = Math.max(
          1,
          nameCol - indent.length - 2 - dur.length - 1,
        );

        const offsetCells = Math.round(
          (node.offsetPercent / 100) * timelineWidth,
        );
        const barCells = Math.max(
          1,
          Math.round((node.widthPercent / 100) * timelineWidth),
        );
        const clampedOffset = Math.max(
          0,
          Math.min(offsetCells, timelineWidth - barCells),
        );

        return (
          <box
            key={span.span_id}
            style={{
              flexDirection: 'row',
              backgroundColor: isSel ? UI.panel : undefined,
            }}
          >
            {/* Selection marker */}
            <text fg={UI.accent} attributes={BOLD}>
              {isSel ? '▸ ' : '  '}
            </text>
            {/* Name column */}
            <box style={{ flexDirection: 'row', width: nameCol }}>
              <text fg={color} attributes={BOLD}>{`${indent}${badge}`}</text>
              <text
                fg={isSel ? UI.textStrong : UI.text}
                attributes={isSel ? BOLD : 0}
              >
                {` ${truncate(span.name, nameMax)}`}
              </text>
              <box style={{ flexGrow: 1 }} />
              <text fg={UI.dim}>{dur}</text>
            </box>
            {/* Timeline */}
            <text> </text>
            <box style={{ width: clampedOffset }} />
            <text fg={color}>{'█'.repeat(barCells)}</text>
          </box>
        );
      })}
    </box>
  );
}

// Evenly spaced duration labels across the timeline width.
function timeScale(duration: number, width: number): string {
  const count = Math.min(6, Math.max(2, Math.floor(width / 12)));
  const labels: string[] = [];
  for (let i = 0; i <= count; i++) {
    labels.push(formatDuration((duration / count) * i));
  }
  const joined = labels.join('');
  const gap = Math.max(1, Math.floor((width - joined.length) / count));
  return labels.join(' '.repeat(gap)).slice(0, width);
}
