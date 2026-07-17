import type { TraceEntry } from '../types';
import { UI, ERROR_RED, OK_GREEN, BOLD } from '../theme';
import { formatDuration, truncate } from '../format';

interface Props {
  traces: TraceEntry[];
  selected: number;
  width: number;
  focused: boolean;
}

export function TraceList({ traces, selected, width, focused }: Props) {
  const innerWidth = width - 4; // borders + padding

  return (
    <box
      style={{
        flexDirection: 'column',
        width,
        border: true,
        borderColor: focused ? UI.borderActive : UI.border,
        backgroundColor: UI.bg,
        paddingLeft: 1,
        paddingRight: 1,
      }}
      title={` Traces (${traces.length}) `}
    >
      {traces.map((t, i) => {
        const isSel = i === selected;
        const isErr = t.trace.status_code === 2;
        const dur = formatDuration(t.trace.duration);
        const nameMax = innerWidth - dur.length - 3;
        const name = truncate(t.trace.custom_name || t.trace.operation_name, nameMax);

        return (
          <box
            key={t.trace.trace_id}
            style={{
              flexDirection: 'row',
              backgroundColor: isSel ? UI.panel : undefined,
            }}
          >
            <text fg={isSel ? UI.accent : UI.dim}>{isSel ? '▸ ' : '  '}</text>
            <text fg={isErr ? ERROR_RED : UI.text} attributes={isSel ? BOLD : 0}>
              {name}
            </text>
            <box style={{ flexGrow: 1 }} />
            <text fg={isErr ? ERROR_RED : OK_GREEN}>{isErr ? '✗' : '✓'}</text>
            <text fg={UI.dim}>{` ${dur}`}</text>
          </box>
        );
      })}
    </box>
  );
}
