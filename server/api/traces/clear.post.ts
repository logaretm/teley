// API endpoint to clear all trace data

export default defineEventHandler(async () => {
  await clearAllData();
  
  // Notify all connected clients
  broadcastClearData();
  
  return {
    status: 'success',
    message: 'All trace data cleared'
  };
});

