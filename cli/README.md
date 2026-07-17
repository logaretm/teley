# teley-cli

A terminal viewer for [Teley](https://teley.dev). It generates a room DSN,
connects to the relay over WebSocket, and renders live traces (as a colorful
waterfall) and logs, without leaving the terminal.

Built with [OpenTUI](https://opentui.com) (React bindings), so it runs on
**Bun**.

## Run

```bash
bunx teley-cli                     # connect to the deployed relay (teley.dev)
bunx teley-cli --demo              # render sample data, no network
bunx teley-cli --host localhost:8787   # point at a local worker
bunx teley-cli --new               # start a fresh room (new DSN)
```

Point your app's OpenTelemetry or Sentry SDK at the DSN shown in the header.

> Requires [Bun](https://bun.sh). OpenTUI uses `bun:ffi` for its native renderer
> and loads tree-sitter assets that Node can't resolve, so `bunx` (not `npx`) is
> the way to run it.

## Keys

- `←`/`→`: switch between the Traces and Logs views
- `↑`/`↓` (or `j`/`k`): navigate the focused panel
  - trace list focused: move between traces
  - waterfall focused: move between spans (the attribute panel shows the
    selected span)
  - logs view: move between log entries
- `tab`: cycle focus — list → detail → connection links
- links focused: `↑`/`↓` selects DSN/OTLP, `↵` (or `y`) copies it
- `c`: clear the local view
- `q`: quit

## How it connects

The CLI is just another relay client (the same path the web app uses). It reuses
the shared domain types (`shared/parsers/types.ts`) and the app's
`buildSpanTree` (`web/app/utils/span-tree.ts`).

- Credentials: `roomId` (nanoid 12) + `receiveToken` (nanoid 24), persisted to
  `~/.teley/session.json` and reused across runs. `--new` rolls a fresh pair.
- Host resolution: `--host` > `$TELEY_HOST` > `teley.dev`. Non-local hosts use
  `wss://`/`https://`; localhost uses plain `ws://`/`http://`.

## Local development

From this directory:

```bash
bun install
bun run dev              # bun run src/index.tsx
bun run dev --demo
bun run typecheck
bun run build            # bundle to dist/ (what gets published)
```

The published package is a single Bun-bundled `dist/index.js` (deps kept
external); the cross-package imports from `shared/` and `web/app` are inlined at
build time.

### Send a test trace

With the CLI running and a worker up, inject a sample trace:

```bash
bun run scripts/send-test-trace.ts --host localhost:8787
```
