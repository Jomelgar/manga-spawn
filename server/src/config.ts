export const config = {
  port: Number(process.env.PORT ?? 8787),
  databasePath: process.env.DATABASE_PATH ?? './data/manga-spawn.sqlite',
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  adminApiKey: process.env.ADMIN_API_KEY ?? '',
  checkIntervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES ?? 30),
  receiptIntervalMinutes: Number(process.env.RECEIPT_INTERVAL_MINUTES ?? 15),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
