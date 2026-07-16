import type { TraceEntry } from '../types';
import { UI, ERROR_RED, OK_GREEN, BOLD, depthColor } from '../theme';
import { buildSpanTree } from '../span-tree';
import { formatDuration, spanKindBadge, statusLabel, truncate } from '../format';

interface Props {
  trace: TraceEntry;
  width: number;
  focused: boolean;
}

const NAME_COL = 32;

export function Waterfall({ trace, width, focused }: Props) {
  const inner = width - 4; // borders + padding
  const nameCol = Math.max(12, Math.min(NAME_COL, Math.floor(inner * 0.5)));
  const timelineWidth = Math.max(4, inner - nameCol - 1);

  const nodes = buildSpanTree(trace.spans, trace.trace);
  const isErr = trace.trace.status_code === 2;
  const scaleLabels = timeScale(trace.trace.duration, timelineWidth);

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
      {/* Meta line */}
      <box style={{ flexDirection: 'row' }}>
        <text fg={UI.dim}>{trace.trace.service_name}</text>
        <text fg={UI.dim}>{'  ·  '}</text>
        <text fg={UI.text}>{formatDuration(trace.trace.duration)}</text>
        <text fg={UI.dim}>{'  ·  '}</text>
        <text fg={UI.dim}>{`${trace.spans.length} spans`}</text>
        <text fg={UI.dim}>{'  ·  '}</text>
        <text fg={UI.dim}>{trace.trace.source}</text>
        <box style={{ flexGrow: 1 }} />
        <text fg={isErr ? ERROR_RED : OK_GREEN} attributes={BOLD}>
          {statusLabel(trace.trace.status_code)}
        </text>
      </box>

      {/* Time scale */}
      <box style={{ flexDirection: 'row', marginTop: 1 }}>
        <box style={{ width: nameCol }} />
        <text fg={UI.dim}>{scaleLabels}</text>
      </box>

      {/* Spans */}
      {nodes.map((node) => {
        const { span, depth } = node;
        const color = depthColor(depth, span.status_code);
        const indent = '  '.repeat(depth);
        const badge = spanKindBadge(span.kind);
        const dur = formatDuration(span.duration);
        const nameMax = Math.max(1, nameCol - indent.length - 2 - dur.length - 1);

        const offsetCells = Math.round((node.offsetPercent / 100) * timelineWidth);
        const barCells = Math.max(1, Math.round((node.widthPercent / 100) * timelineWidth));
        const clampedOffset = Math.max(0, Math.min(offsetCells, timelineWidth - barCells));

        return (
          <box key={span.span_id} style={{ flexDirection: 'row' }}>
            {/* Name column */}
            <box style={{ flexDirection: 'row', width: nameCol }}>
              <text fg={color} attributes={BOLD}>{`${indent}${badge}`}</text>
              <text fg={UI.text}>{` ${truncate(span.name, nameMax)}`}</text>
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
