# OpenTelemetry Viewer

A real-time OpenTelemetry trace visualizer built with Nuxt 3 and Vue 3. View and debug traces from your instrumented applications with an intuitive waterfall visualization.

## Features

- 🔄 Real-time trace updates via WebSocket
- 📊 Waterfall visualization of spans
- 🔍 Detailed span information panel
- 🎨 Clean, modern UI inspired by Sentry
- 💾 SQLite storage with Node.js 24 native support
- 🚀 OTLP-compatible HTTP endpoint
- ⚡ Fast and lightweight

## Requirements

- Node.js >= 24.0.0
- pnpm (or npm/yarn)

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at http://localhost:3000

## Sending Traces

The viewer accepts OTLP (OpenTelemetry Protocol) traces via HTTP/JSON at:

```
POST http://localhost:3000/api/v1/traces
```

**Note:** Use the HTTP/JSON exporter (not protobuf) from your application.

### Configuration in Your Application

Configure your OpenTelemetry HTTP exporter to send traces to the viewer:

#### Node.js Example (JSON - easier to debug)

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:3000/api/v1/traces',
    headers: {},
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

#### Node.js Example (Protobuf - more efficient)

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:3000/api/v1/traces',
    headers: {},
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

#### Python Example

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://localhost:3000/api/v1/traces",
)

span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)
```

## Usage

1. **Start the viewer**: Run `pnpm dev`
2. **Configure your app**: Point your OTLP exporter to `http://localhost:3000/api/v1/traces`
3. **Generate traces**: Run your instrumented application
4. **View traces**: Traces will appear in real-time in the left sidebar
5. **Inspect spans**: Click on a trace to see the waterfall view
6. **View details**: Click on any span to see its attributes, events, and links

## Features Overview

### Trace List
- Shows all received traces
- Displays service name, operation, duration, and status
- Real-time updates as new traces arrive
- Error highlighting for failed traces

### Waterfall View
- Hierarchical span visualization
- Time-proportional span bars
- Span kind badges (Server, Client, Internal, Producer, Consumer)
- Color-coded error spans
- Duration labels

### Span Details Panel
- Span metadata (ID, parent, kind, status)
- Attributes/tags
- Events with timestamps
- Linked spans
- Error messages

### Clear Data
- Clear all stored traces with one click
- Resets both database and UI

## Architecture

- **Frontend**: Vue 3 with Composition API
- **Backend**: Nuxt Nitro server
- **Database**: SQLite (Node.js 24 native)
- **WebSocket**: Real-time updates using Nitro's WebSocket support
- **Protocol**: OTLP (OpenTelemetry Protocol) HTTP

## API Endpoints

- `POST /api/v1/traces` - Receive OTLP traces
- `GET /api/traces` - Fetch all traces
- `GET /api/traces/:traceId` - Fetch specific trace with spans
- `POST /api/traces/clear` - Clear all data
- `WS /_ws` - WebSocket for real-time updates

## Data Storage

Traces are stored in SQLite at `.data/otel.db`. The database includes:
- Traces table: High-level trace information
- Spans table: Individual span data with attributes, events, and links

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## License

MIT
