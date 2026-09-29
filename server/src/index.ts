import { serve } from '@hono/node-server';
import cron from 'node-cron';

import { app } from './app';
import { config } from './config';
import { checkForNewChapters } from './jobs/chapter-checker';
import { checkPushReceipts } from './jobs/receipt-checker';

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[server] escuchando en http://localhost:${info.port}`);
});

cron.schedule(`*/${config.checkIntervalMinutes} * * * *`, () => {
  checkForNewChapters().catch((error) => console.error('[cron] chapter-checker', error));
});

cron.schedule(`*/${config.receiptIntervalMinutes} * * * *`, () => {
  checkPushReceipts().catch((error) => console.error('[cron] receipt-checker', error));
});

console.log(
  `[server] cron activo: capítulos cada ${config.checkIntervalMinutes} min, recibos cada ${config.receiptIntervalMinutes} min`,
);
