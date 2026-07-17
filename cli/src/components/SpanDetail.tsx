import type { Span } from '../types';
import { UI, BOLD, ERROR_RED, OK_GREEN } from '../theme';
import { formatDuration, spanKindLabel, statusLabel, truncate, stringifyValue } from '../format';

interface Props {
  span: Span;
  width: number;
  height: number; // rows available for this panel (incl. border)
  focused: boolean;
}

function Label({ text }: { text: string }) {
  return <text fg={UI.dim} attributes={BOLD}>{text}</text>;
}

export function SpanDetail({ span, width, height, focused }: Props) {
  const inner = width - 4; // border + padding
  const isErr = span.status_code === 2;
  const attrs = Object.entries(span.attributes ?? {});

  // Budget the attribute rows to what's left after the fixed header lines.
  const headerRows = 2 /* meta + span id */ + (isErr && span.status_message ? 1 : 0) + 1 /* attrs label */;
  const attrBudget = Math.max(1, height - 2 - headerRows);
  const shownAttrs = attrs.slice(0, attrBudget);
  const hidden = attrs.length - shownAttrs.length;

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
      title={` ${truncate(span.name, Math.max(4, inner - 2))} `}
    >
      {/* Meta line */}
      <box style={{ flexDirection: 'row' }}>
        <text fg={UI.text}>{spanKindLabel(span.kind)}</text>
        <text fg={UI.dim}>{'  ·  '}</text>
        <text fg={UI.text}>{formatDuration(span.duration)}</text>
        <box style={{ flexGrow: 1 }} />
        <text fg={isErr ? ERROR_RED : OK_GREEN} attributes={BOLD}>{statusLabel(span.status_code)}</text>
      </box>

      {/* Span id */}
      <box style={{ flexDirection: 'row' }}>
        <Label text="span " />
        <text fg={UI.text}>{truncate(span.span_id, Math.max(4, inner - 5))}</text>
      </box>

      {/* Error message */}
      {isErr && span.status_message ? (
        <text fg={ERROR_RED}>{truncate(span.status_message, inner)}</text>
      ) : null}

      {/* Attributes */}
      <box style={{ flexDirection: 'column', marginTop: 1 }}>
        <Label text="attributes" />
        {attrs.length === 0 ? (
          <text fg={UI.dim}>none</text>
        ) : (
          shownAttrs.map(([key, value]) => {
            const k = `${key}: `;
            return (
              <box key={key} style={{ flexDirection: 'row' }}>
                <text fg={UI.dim}>{k}</text>
                <text fg={UI.text}>{truncate(stringifyValue(value), Math.max(4, inner - k.length))}</text>
              </box>
            );
          })
        )}
        {hidden > 0 ? <text fg={UI.dim}>{`+${hidden} more`}</text> : null}
      </box>
    </box>
  );
}
