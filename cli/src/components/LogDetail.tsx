import type { Log } from '../types';
import { UI, BOLD, severityColor } from '../theme';
import {
  formatLogTime,
  severityLabel,
  stripAnsi,
  truncate,
  wrapText,
  stringifyValue,
} from '../format';

interface Props {
  log: Log;
  width: number;
  focused: boolean;
}

function Label({ text }: { text: string }) {
  return (
    <text fg={UI.dim} attributes={BOLD}>
      {text}
    </text>
  );
}

export function LogDetail({ log, width, focused }: Props) {
  const inner = width - 4; // border + padding
  const label = severityLabel(log.severity_number, log.severity_text);
  const color = severityColor(label);
  const attrs = Object.entries(log.attributes ?? {});

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
      title={` ${label} `}
    >
      {/* Meta: severity on one line, service + time below, so it never wraps oddly. */}
      <text fg={color} attributes={BOLD}>{`● ${label}`}</text>
      <text fg={UI.dim}>
        {truncate(
          `${log.service_name}  ·  ${formatLogTime(log.timestamp)}`,
          inner,
        )}
      </text>

      {/* Body */}
      <box style={{ flexDirection: 'column', marginTop: 1 }}>
        {wrapText(stripAnsi(log.body), inner).map((line, i) => (
          <text key={i} fg={UI.text}>
            {line}
          </text>
        ))}
      </box>

      {/* Trace correlation */}
      {log.trace_id || log.span_id ? (
        <box style={{ flexDirection: 'column', marginTop: 1 }}>
          {log.trace_id ? (
            <box style={{ flexDirection: 'row' }}>
              <Label text="trace  " />
              <text fg={UI.text}>{truncate(log.trace_id, inner - 7)}</text>
            </box>
          ) : null}
          {log.span_id ? (
            <box style={{ flexDirection: 'row' }}>
              <Label text="span   " />
              <text fg={UI.text}>{truncate(log.span_id, inner - 7)}</text>
            </box>
          ) : null}
        </box>
      ) : null}

      {/* Attributes */}
      {attrs.length > 0 ? (
        <box style={{ flexDirection: 'column', marginTop: 1 }}>
          <Label text="attributes" />
          {attrs.map(([key, value]) => {
            const k = `${key}: `;
            return (
              <box key={key} style={{ flexDirection: 'row' }}>
                <text fg={UI.dim}>{k}</text>
                <text fg={UI.text}>
                  {truncate(
                    stringifyValue(value),
                    Math.max(4, inner - k.length),
                  )}
                </text>
              </box>
            );
          })}
        </box>
      ) : null}
    </box>
  );
}
