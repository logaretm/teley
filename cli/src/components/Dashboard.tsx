import { useEffect, useRef, useState } from 'react';
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react';
import { Header } from './Header';
import { TraceList } from './TraceList';
import { Waterfall } from './Waterfall';
import { EmptyState } from './EmptyState';
import { StatusBar } from './StatusBar';
import { UI } from '../theme';
import { nativeCopy } from '../clipboard';
import type { TraceEntry } from '../types';
import type { RelayStatus } from '../relay';
import type { Endpoints } from '../session';

interface Props {
  endpoints: Endpoints;
  status: RelayStatus;
  viewers: number;
  traces: TraceEntry[];
  onClear: () => void;
}

type Focus = 'list' | 'detail' | 'links';

const COPIED_MS = 1600;

export function Dashboard({ endpoints, status, viewers, traces, onClear }: Props) {
  const { width, height } = useTerminalDimensions();
  const renderer = useRenderer();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus>('list');
  const [selectedLink, setSelectedLink] = useState(0); // 0 = DSN, 1 = OTLP
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the selection stable across live updates; default to the newest trace.
  const selectedIndex = Math.max(
    0,
    traces.findIndex((t) => t.trace.trace_id === selectedId),
  );
  const current = traces[selectedIndex];

  useEffect(() => {
    if (traces.length === 0) return;
    const stillThere = traces.some((t) => t.trace.trace_id === selectedId);
    if (!stillThere) setSelectedId(traces[0]!.trace.trace_id);
  }, [traces, selectedId]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const copyLink = (idx: number) => {
    const text = idx === 0 ? endpoints.dsn : endpoints.otlp;
    try {
      renderer.copyToClipboardOSC52(text); // works over SSH / modern terminals
    } catch {
      // ignore
    }
    nativeCopy(text); // covers terminals without OSC52 (e.g. Terminal.app)
    setCopiedLink(idx);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopiedLink(null), COPIED_MS);
  };

  useKeyboard((key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      process.exit(0);
    }
    if (key.name === 'tab') {
      setFocus((f) => (f === 'list' ? 'detail' : f === 'detail' ? 'links' : 'list'));
      return;
    }

    if (focus === 'links') {
      if (key.name === 'up' || key.name === 'k') setSelectedLink(0);
      if (key.name === 'down' || key.name === 'j') setSelectedLink(1);
      if (key.name === 'return' || key.name === 'enter' || key.name === 'y') {
        copyLink(selectedLink);
      }
      return;
    }

    if (key.name === 'c') {
      onClear();
      return;
    }
    if (traces.length === 0) return;
    if (key.name === 'up' || key.name === 'k') {
      setSelectedId(traces[Math.max(0, selectedIndex - 1)]!.trace.trace_id);
    }
    if (key.name === 'down' || key.name === 'j') {
      setSelectedId(traces[Math.min(traces.length - 1, selectedIndex + 1)]!.trace.trace_id);
    }
  });

  const listWidth = Math.max(24, Math.min(38, Math.floor(width * 0.3)));

  return (
    <box style={{ flexDirection: 'column', width, height, backgroundColor: UI.bg }}>
      <Header
        dsn={endpoints.dsn}
        otlp={endpoints.otlp}
        viewers={viewers}
        status={status}
        focused={focus === 'links'}
        selectedLink={selectedLink}
        copiedLink={copiedLink}
      />

      <box style={{ flexDirection: 'row', flexGrow: 1 }}>
        {traces.length === 0 || !current ? (
          <EmptyState status={status} />
        ) : (
          <>
            <TraceList
              traces={traces}
              selected={selectedIndex}
              width={listWidth}
              focused={focus === 'list'}
            />
            <Waterfall trace={current} width={width - listWidth} focused={focus === 'detail'} />
          </>
        )}
      </box>

      <StatusBar focus={focus} />
    </box>
  );
}
