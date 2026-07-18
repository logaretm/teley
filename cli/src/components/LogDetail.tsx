import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { ScrollBoxRenderable } from '@opentui/core';
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
import { useScrollOverflow } from './use-scroll-overflow';

interface Props {
  log: Log;
  width: number;
  height: number; // rows available for this panel (incl. border)
  focused: boolean;
  scrollRef: RefObject<ScrollBoxRenderable | null>;
  onScrollable: (scrollable: boolean) => void;
}

function Label({ text }: { text: string }) {
  return (
    <text fg={UI.dim} attributes={BOLD}>
      {text}
    </text>
  );
}

export function LogDetail({
  log,
  width,
  height,
  focused,
  scrollRef,
  onScrollable,
}: Props) {
  const inner = width - 4; // border + padding
  const label = severityLabel(log.severity_number, log.severity_text);
  const color = severityColor(label);
  const attrs = Object.entries(log.attributes ?? {});

  // Reset to the top when a different log is selected.
  useEffect(() => {
    scrollRef.current?.scrollTo(0);
  }, [log.log_id, scrollRef]);

  useScrollOverflow(scrollRef, onScrollable);

  return (
    <box
      style={{
        flexDirection: 'column',
        flexGrow: 1,
        height,
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

      {/* Body, correlation and attributes scroll together below the meta. */}
      <scrollbox
        ref={scrollRef}
        focused={focused}
        style={{ flexGrow: 1, marginTop: 1, backgroundColor: UI.bg }}
        // Start the scrollbar hidden (and in manual mode) so the scrollbox can't
        // auto-flash it during the first-layout settle; the hook reveals it once
        // a stable overflow measurement lands.
        scrollbarOptions={{ visible: false }}
        contentOptions={{ flexDirection: 'column' }}
      >
        {/* Body */}
        {wrapText(stripAnsi(log.body), inner - 1).map((line, i) => (
          <text key={i} fg={UI.text}>
            {line}
          </text>
        ))}

        {/* Trace correlation */}
        {log.trace_id || log.span_id ? (
          <box style={{ flexDirection: 'column', marginTop: 1 }}>
            {log.trace_id ? (
              <box style={{ flexDirection: 'row' }}>
                <Label text="trace  " />
                <text fg={UI.text}>{truncate(log.trace_id, inner - 8)}</text>
              </box>
            ) : null}
            {log.span_id ? (
              <box style={{ flexDirection: 'row' }}>
                <Label text="span   " />
                <text fg={UI.text}>{truncate(log.span_id, inner - 8)}</text>
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
                      Math.max(4, inner - k.length - 1),
                    )}
                  </text>
                </box>
              );
            })}
          </box>
        ) : null}
      </scrollbox>
    </box>
  );
}
