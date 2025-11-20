export default defineEventHandler((event) => {
  // Set CORS headers for all requests
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400', // 24 hours
  });

  // Handle preflight OPTIONS requests
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return '';
  }
});
