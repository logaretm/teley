// API endpoint to fetch all traces

export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string) : 100;

    const traces = await getTraces(limit);

    return {
      traces,
    };
  },
  {
    maxAge: 60 * 60 * 4, // 4 hours
    swr: true,
  },
);
