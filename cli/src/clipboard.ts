// Best-effort clipboard copy via the platform's native tool.
// Paired with OpenTUI's OSC52 copy (see Dashboard) so at least one path works:
// OSC52 covers SSH / modern terminals; the native tool covers e.g. Terminal.app.

import { spawn } from 'node:child_process';

function command(): [string, string[]] | null {
  switch (process.platform) {
    case 'darwin':
      return ['pbcopy', []];
    case 'win32':
      return ['clip', []];
    default:
      // Linux: prefer Wayland, fall back handled by the shell if missing.
      return process.env.WAYLAND_DISPLAY
        ? ['wl-copy', []]
        : ['xclip', ['-selection', 'clipboard']];
  }
}

export function nativeCopy(text: string): void {
  const cmd = command();
  if (!cmd) return;
  try {
    const proc = spawn(cmd[0], cmd[1], { stdio: ['pipe', 'ignore', 'ignore'] });
    proc.on('error', () => {}); // ignore a missing tool rather than crash the TUI
    proc.stdin.write(text);
    proc.stdin.end();
  } catch {
    // ignore
  }
}
