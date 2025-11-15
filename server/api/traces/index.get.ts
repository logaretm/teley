// API endpoint to fetch all traces

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = query.limit ? parseInt(query.limit as string) : 100;
  
  const traces = await getTraces(limit);
  
  return {
    traces
  };
});

