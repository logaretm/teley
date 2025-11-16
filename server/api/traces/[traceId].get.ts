// API endpoint to fetch a single trace with its spans

export default defineCachedEventHandler(
  async (event) => {
    const traceId = getRouterParam(event, 'traceId');

    if (!traceId) {
      throw createError({
        statusCode: 400,
        message: 'Trace ID is required',
      });
    }

    const trace = await getTrace(traceId);

    if (!trace) {
      throw createError({
        statusCode: 404,
        message: 'Trace not found',
      });
    }

    const spans = await getSpansByTraceId(traceId);

    return {
      trace,
      spans,
    };
  },
  {
    maxAge: 60 * 60 * 4, // 4 hours
    swr: true,
  },
);
