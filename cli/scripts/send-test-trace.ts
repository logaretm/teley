#!/usr/bin/env bun
// Sends a sample OTLP trace to your local room so you can watch it render live.
//
//   bun scripts/send-test-trace.ts [--host localhost:8787]
//
// Run the worker (pnpm dev:worker) and the CLI (pnpm dev) first, then run this.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const hostArg = process.argv.indexOf('--host');
const host =
  hostArg !== -1
    ? process.argv[hostArg + 1]
    : process.env.TELEY_HOST || 'localhost:8787';
const secure = !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/.test(
  host!,
);
const scheme = secure ? 'https' : 'http';

const session = JSON.parse(
  readFileSync(join(homedir(), '.teley', 'session.json'), 'utf8'),
);
const url = `${scheme}://${host}/r/${session.roomId}`;

const hex = (n: number) =>
  Array.from({ length: n }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');

const traceId = hex(32);
const now = Date.now();
const ms = (n: number) => String((now + n) * 1_000_000); // ms → unix nano

const root = hex(16);
const dbSpan = hex(16);
const httpSpan = hex(16);

function span(
  spanId: string,
  parentSpanId: string | null,
  name: string,
  kind: number,
  startMs: number,
  durMs: number,
  statusCode = 0,
  attrs: Record<string, string | number> = {},
) {
  return {
    traceId,
    spanId,
    ...(parentSpanId ? { parentSpanId } : {}),
    name,
    kind,
    startTimeUnixNano: ms(startMs),
    endTimeUnixNano: ms(startMs + durMs),
    status: { code: statusCode },
    attributes: Object.entries(attrs).map(([key, v]) => ({
      key,
      value: typeof v === 'number' ? { intValue: v } : { stringValue: v },
    })),
  };
}

const payload = {
  resourceSpans: [
    {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'checkout-api' } },
        ],
      },
      scopeSpans: [
        {
          scope: { name: 'teley.test' },
          spans: [
            span(root, null, 'POST /checkout', 2, 0, 214, 2, {
              'http.method': 'POST',
              'http.status_code': 500,
            }),
            span(httpSpan, root, 'GET inventory-service', 3, 10, 60, 0, {
              'peer.service': 'inventory',
            }),
            span(dbSpan, root, 'db.query orders', 3, 80, 120, 2, {
              'db.system': 'postgresql',
            }),
          ],
        },
      ],
    },
  ],
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log(`POST ${url}`);
console.log(`${res.status} ${res.statusText}: ${await res.text()}`);
