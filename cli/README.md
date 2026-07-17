# teley CLI

A terminal trace viewer for [Teley](../). It generates a room DSN, connects to
the relay over WebSocket, and renders live traces as a colorful waterfall,
without leaving the terminal.

Built with [OpenTUI](https://opentui.com) (React bindings). Traces only for now;
logs and metrics come later.

## Run

```bash
pnpm install
pnpm dev                 # connects to the deployed relay (teley.dev)
pnpm dev --demo          # render sample traces, no network
pnpm dev --host localhost:8787   # point at a local worker (pnpm dev:worker)
pnpm dev --new           # start a fresh room (new DSN)
```

Point your app's OpenTelemetry or Sentry SDK at the DSN shown in the header.

## Keys

- `↑`/`↓` (or `j`/`k`): navigate traces
- `tab`: cycle focus — trace list → detail → connection links
- when the links region is focused: `↑`/`↓` selects DSN/OTLP, `↵` copies it
- `c`: clear the local view
- `q`: quit

## How it connects

The CLI is just another relay client (same path the web app uses). It reuses the
shared domain types (`shared/parsers/types.ts`) and the app's `buildSpanTree`.

- Credentials: `roomId` (nanoid 12) + `receiveToken` (nanoid 24), persisted to
  `~/.teley/session.json` and reused across runs. `--new` rolls a fresh pair.
- Host resolution: `--host` > `$TELEY_HOST` > `teley.dev`. Non-local hosts use
  `wss://`/`https://`; localhost uses plain `ws://`/`http://`.

## Requirements

Runs under **Bun** — OpenTUI's native core imports tree-sitter query files that
Node's ESM loader can't resolve. Packaging for `npx` (bundle or Bun binary) is a
follow-up.

## Send a test trace

With the CLI running and a worker up, inject a sample trace:

```bash
bun run scripts/send-test-trace.ts --host localhost:8787
```
