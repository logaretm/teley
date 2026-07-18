import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { Span } from '../types';
import { UI, BOLD, ERROR_RED, OK_GREEN } from '../theme';
import {
  formatDuration,
  spanKindLabel,
  statusLabel,
  truncate,
  stringifyValue,
} from '../format';
import { useScrollOverflow } from './use-scroll-overflow';

interface Props {
  span: Span;
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

export function SpanDetail({
  span,
  width,
  height,
  focused,
  scrollRef,
  onScrollable,
}: Props) {
  const inner = width - 4; // border + padding
  const isErr = span.status_code === 2;
  const attrs = Object.entries(span.attributes ?? {});

  // Snap back to the top whenever a different span is selected, so a scroll
  // position left over from the previous span doesn't hide its first rows.
  useEffect(() => {
    scrollRef.current?.scrollTo(0);
  }, [span.span_id, scrollRef]);

  useScrollOverflow(scrollRef, onScrollable);

  return (
    <box
      style={{
        flexDirection: 'column',
        width,
        height,
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
        <text fg={isErr ? ERROR_RED : OK_GREEN} attributes={BOLD}>
          {statusLabel(span.status_code)}
        </text>
      </box>

      {/* Span id */}
      <box style={{ flexDirection: 'row' }}>
        <Label text="span " />
        <text fg={UI.text}>
          {truncate(span.span_id, Math.max(4, inner - 5))}
        </text>
      </box>

      {/* Error message */}
      {isErr && span.status_message ? (
        <text fg={ERROR_RED}>{truncate(span.status_message, inner)}</text>
      ) : null}

      {/* Attributes: label stays pinned, the rows below scroll. The scrollbox
          stays mounted even when empty so its overflow measurement survives
          span switches without flashing. */}
      <box style={{ marginTop: 1 }}>
        <Label text="attributes" />
      </box>
      <scrollbox
        ref={scrollRef}
        focused={focused}
        style={{ flexGrow: 1, backgroundColor: UI.bg }}
        // Start the scrollbar hidden (and in manual mode) so the scrollbox can't
        // auto-flash it during the first-layout settle; the hook reveals it once
        // a stable overflow measurement lands.
        scrollbarOptions={{ visible: false }}
        contentOptions={{ flexDirection: 'column' }}
      >
        {attrs.length === 0 ? (
          <text fg={UI.dim}>none</text>
        ) : (
          attrs.map(([key, value]) => {
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
          })
        )}
      </scrollbox>
    </box>
  );
}
