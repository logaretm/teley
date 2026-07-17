import { UI, BOLD } from '../theme';
import type { RelayStatus } from '../relay';

interface Props {
  status: RelayStatus;
  what?: 'traces' | 'logs';
}

export function EmptyState({ status, what = 'traces' }: Props) {
  return (
    <box
      style={{
        flexGrow: 1,
        border: true,
        borderColor: UI.border,
        backgroundColor: UI.bg,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2,
        paddingRight: 2,
      }}
    >
      <text fg={UI.text} attributes={BOLD}>
        {status === 'connected' ? `Waiting for ${what}…` : 'Connecting to relay…'}
      </text>
      <text fg={UI.dim}>Point your app's telemetry at the DSN above.</text>
      <text fg={UI.dim}>Press tab to select a link, then ↵ to copy it.</text>
    </box>
  );
}
