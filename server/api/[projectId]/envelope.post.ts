// Sentry Envelope Endpoint
// Compatible with Sentry SDK DSN: http://public_key@localhost:3000/1
//
// This endpoint accepts Sentry's envelope format and converts it to OTLP
// for storage and visualization in the viewer.
//
// Sentry SDKs send data to /api/:projectId/envelope/
//
// Reference: https://develop.sentry.dev/sdk/envelopes/

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'projectId');
  console.log('[Sentry] ========================================');
  console.log('[Sentry] Received envelope request for project:', projectId);

  try {
    // Check Content-Type (Sentry uses application/x-sentry-envelope)
    const contentType = getHeader(event, 'content-type');
    console.log('[Sentry] Content-Type:', contentType);

    // Read raw body (Sentry envelopes are newline-delimited JSON)
    const rawBody = await readRawBody(event, 'utf-8');

    if (!rawBody) {
      console.error('[Sentry] ERROR: Empty body');
      throw createError({
        statusCode: 400,
        message: 'Empty envelope body',
      });
    }

    console.log('[Sentry] Received envelope, size:', rawBody.length, 'bytes');

    // Parse Sentry envelope
    let envelope;
    try {
      envelope = parseSentryEnvelope(rawBody);
      console.log('[Sentry] Parsed envelope with', envelope.items.length, 'items');
    } catch (error: any) {
      console.error('[Sentry] ERROR: Failed to parse envelope:', error.message);
      throw createError({
        statusCode: 400,
        message: `Invalid envelope format: ${error.message}`,
      });
    }

    // Convert Sentry data to OTLP and store
    const result = await processSentryEnvelope(envelope);

    console.log('[Sentry] Processed:', result.traces.length, 'traces,', result.logs.length, 'logs');

    // Broadcast updates to connected WebSocket clients
    try {
      // Broadcast traces
      for (const traceId of result.traces) {
        const trace = await getTrace(traceId);
        if (trace) {
          const spans = await getSpansByTraceId(traceId);
          broadcastTraceUpdate({ trace, spans });
        }
      }

      // Broadcast logs
      for (const logId of result.logs) {
        const logs = await getLogs(1);
        if (logs.length > 0) {
          broadcastLogUpdate({ log: logs[0] });
        }
      }
    } catch (broadcastError: any) {
      console.error('[Sentry] Error broadcasting updates:', broadcastError);
      // Continue anyway - the data was saved
    }

    // Return Sentry-compatible response with event ID
    const eventId = envelope.headers.event_id || generateEventId();
    console.log('[Sentry] SUCCESS: Returning event_id:', eventId);

    return {
      id: eventId,
      status: 'success',
    };
  } catch (error: any) {
    console.error('[Sentry] FATAL ERROR:', error.message);
    console.error('[Sentry] Error stack:', error.stack);

    // Return error in Sentry-compatible format
    setResponseStatus(event, error.statusCode || 500);
    return {
      error: error.message,
      error_description: error.message,
    };
  }
});

/**
 * Generate a Sentry-compatible event ID (UUID v4 without dashes)
 */
function generateEventId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

