import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = fileURLToPath(new URL('..', import.meta.url));
const envPath = resolve(serverDir, '.env');

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const databasePath = process.env.DATABASE_PATH
  ? resolve(serverDir, process.env.DATABASE_PATH)
  : resolve(serverDir, 'data/manga-spawn.sqlite');

export const config = {
  port: Number(process.env.PORT ?? 8787),
  databasePath,
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  adminApiKey: process.env.ADMIN_API_KEY ?? '',
  checkIntervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES ?? 30),
  receiptIntervalMinutes: Number(process.env.RECEIPT_INTERVAL_MINUTES ?? 15),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
