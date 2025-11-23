// OTLP HTTP endpoint for receiving traces
// Standard endpoint: /api/v1/otlp/traces (compatible with OTLP exporters)
// Supports JSON format (use @opentelemetry/exporter-trace-otlp-http)

export default defineEventHandler(async (event) => {
  try {
    // Read JSON body
    const traceData = await readBody(event);

    if (!traceData || !traceData.resourceSpans) {
      throw new Error('Invalid OTLP trace data: missing resourceSpans');
    }

    console.log('[OTLP] Received trace data with', traceData.resourceSpans.length, 'resource spans');

    // Process OTLP trace data
    const traceIds = await processOTLPTrace(traceData);

    // Broadcast updates to connected WebSocket clients (don't let this fail the request)
    try {
      for (const traceId of traceIds) {
        const trace = await getTrace(traceId);
        const spans = await getSpansByTraceId(traceId);

        broadcastTraceUpdate({
          trace,
          spans
        });
      }
    } catch (broadcastError: any) {
      console.error('[OTLP] Error broadcasting updates:', broadcastError);
      // Continue anyway - the data was saved
    }

    return {
      status: 'success',
      tracesReceived: traceIds.length
    };
  } catch (error: any) {
    console.error('Error processing OTLP data:', error);
    setResponseStatus(event, 500);
    return {
      status: 'error',
      message: error.message
    };
  }
});
