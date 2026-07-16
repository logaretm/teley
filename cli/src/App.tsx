import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { useLiveTraces } from './relay';
import { MOCK_TRACES } from './mock-data';
import type { Endpoints } from './session';

// Live mode: connects to the relay WebSocket and streams real traces.
export function LiveApp({ endpoints }: { endpoints: Endpoints }) {
  const { status, viewers, traces, clear } = useLiveTraces(endpoints.wsUrl);
  return (
    <Dashboard
      endpoints={endpoints}
      status={status}
      viewers={viewers}
      traces={traces}
      onClear={clear}
    />
  );
}

// Demo mode (--demo): renders the mock traces with no network connection.
export function DemoApp({ endpoints }: { endpoints: Endpoints }) {
  const [traces, setTraces] = useState(MOCK_TRACES);
  return (
    <Dashboard
      endpoints={endpoints}
      status="connected"
      viewers={1}
      traces={traces}
      onClear={() => setTraces([])}
    />
  );
}
