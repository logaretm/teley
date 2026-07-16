import { UI, OK_GREEN, BOLD } from '../theme';
import type { RelayStatus } from '../relay';

interface Props {
  dsn: string;
  otlp: string;
  viewers: number;
  status: RelayStatus;
  focused: boolean; // links region has focus
  selectedLink: number; // 0 = DSN, 1 = OTLP
  copiedLink: number | null;
}

const STATUS_META: Record<RelayStatus, { dot: string; label: string; color: string }> = {
  connected: { dot: '●', label: 'live', color: OK_GREEN },
  connecting: { dot: '○', label: 'connecting', color: '#f59e0b' },
  disconnected: { dot: '○', label: 'offline', color: UI.dim },
};

function LinkRow({
  label,
  value,
  active,
  copied,
}: {
  label: string;
  value: string;
  active: boolean;
  copied: boolean;
}) {
  return (
    <box style={{ flexDirection: 'row', backgroundColor: active ? UI.panel : undefined }}>
      <text fg={active ? UI.accent : UI.dim}>{active ? '▸ ' : '  '}</text>
      <text fg={UI.dim}>{label}</text>
      <text fg={active ? UI.textStrong : UI.text}>{value}</text>
      {copied ? (
        <text fg={OK_GREEN}> copied ✓</text>
      ) : null}
    </box>
  );
}

export function Header({ dsn, otlp, viewers, status, focused, selectedLink, copiedLink }: Props) {
  const s = STATUS_META[status];
  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? UI.borderActive : UI.border,
        backgroundColor: UI.panel,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <box style={{ flexDirection: 'row' }}>
        <text fg={UI.accent} attributes={BOLD}>
          teley
        </text>
        <text fg={UI.dim}> · terminal trace viewer</text>
        <box style={{ flexGrow: 1 }} />
        {focused ? (
          <text fg={UI.dim}>↑↓ select · ↵ copy   </text>
        ) : null}
        <text fg={s.color}>{`${s.dot} ${s.label}`}</text>
        {status === 'connected' ? (
          <text fg={UI.dim}>{`  ·  ${viewers} viewer${viewers === 1 ? '' : 's'}`}</text>
        ) : null}
      </box>
      <LinkRow
        label="DSN   "
        value={dsn}
        active={focused && selectedLink === 0}
        copied={copiedLink === 0}
      />
      <LinkRow
        label="OTLP  "
        value={otlp}
        active={focused && selectedLink === 1}
        copied={copiedLink === 1}
      />
    </box>
  );
}
