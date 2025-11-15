export default defineNitroPlugin(async () => {
  try {
    await initDatabase();
    console.log('[DB] Database initialized successfully');
  } catch (error: any) {
    console.error('[DB] Failed to initialize database:', error);
    // Don't throw - let the app start anyway
  }
});

