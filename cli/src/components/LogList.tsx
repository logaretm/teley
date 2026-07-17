import type { Log } from '../types';
import { UI, BOLD, severityColor } from '../theme';
import { formatLogTime, severityLabel, stripAnsi, truncate } from '../format';

interface Props {
  logs: Log[];
  selected: number;
  width: number;
  height: number; // rows available for this panel (incl. border)
  focused: boolean;
}

const TIME_COL = 12; // HH:MM:SS.mmm
const SERVICE_COL = 12;

export function LogList({ logs, selected, width, height, focused }: Props) {
  const innerWidth = width - 4; // border + padding
  // Rows for log lines = panel height minus the top/bottom border.
  const visible = Math.max(1, height - 2);
  const start =
    selected < visible
      ? 0
      : Math.min(selected - visible + 1, Math.max(0, logs.length - visible));
  const shown = logs.slice(start, start + visible);

  const used = 2 /* arrow */ + 2 /* dot */ + (TIME_COL + 1) + (SERVICE_COL + 1);
  const msgMax = Math.max(4, innerWidth - used);

  const title =
    logs.length > visible
      ? ` Logs (${selected + 1}/${logs.length}) `
      : ` Logs (${logs.length}) `;

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
      title={title}
    >
      {shown.map((log, i) => {
        const idx = start + i;
        const isSel = idx === selected;
        const label = severityLabel(log.severity_number, log.severity_text);
        const color = severityColor(label);
        const time = formatLogTime(log.timestamp);
        const service = truncate(log.service_name, SERVICE_COL).padEnd(SERVICE_COL);
        const body = truncate(stripAnsi(log.body), msgMax);

        return (
          <box
            key={log.log_id}
            style={{ flexDirection: 'row', backgroundColor: isSel ? UI.panel : undefined }}
          >
            <text fg={isSel ? UI.accent : UI.dim}>{isSel ? '▸ ' : '  '}</text>
            <text fg={color} attributes={BOLD}>{'● '}</text>
            <text fg={UI.dim}>{`${time} `}</text>
            <text fg={UI.text}>{`${service} `}</text>
            <text fg={isSel ? UI.textStrong : UI.text} attributes={isSel ? BOLD : 0}>
              {body}
            </text>
          </box>
        );
      })}
    </box>
  );
}
