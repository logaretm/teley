// OTLP HTTP endpoint for receiving logs
// Standard endpoint: /api/v1/logs (compatible with OTLP exporters)
// Supports JSON format (use @opentelemetry/exporter-logs-otlp-http)

export default defineEventHandler(async (event) => {
  try {
    // Read JSON body
    const logData = await readBody(event);

    if (!logData || !logData.resourceLogs) {
      throw new Error('Invalid OTLP log data: missing resourceLogs');
    }

    console.log('[OTLP] Received log data with', logData.resourceLogs.length, 'resource logs');

    // Process OTLP log data
    const logIds = await processOTLPLogs(logData);

    // Broadcast updates to connected WebSocket clients (don't let this fail the request)
    try {
      for (const logId of logIds) {
        const logs = await getLogs(1);
        if (logs.length > 0) {
          broadcastLogUpdate({
            log: logs[0]
          });
        }
      }
    } catch (broadcastError: any) {
      console.error('[OTLP] Error broadcasting log updates:', broadcastError);
      // Continue anyway - the data was saved
    }

    return {
      status: 'success',
      logsReceived: logIds.length
    };
  } catch (error: any) {
    console.error('Error processing OTLP log data:', error);
    setResponseStatus(event, 500);
    return {
      status: 'error',
      message: error.message
    };
  }
});

