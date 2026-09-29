import { Hono } from 'hono';
import { z } from 'zod';

import {
  deleteDevice,
  getDevice,
  replaceSubscriptions,
  upsertDevice,
} from '../db/repository';
import { rateLimit } from '../middleware/rate-limit';

const deviceSchema = z.object({
  deviceId: z.string().min(1).max(128),
  token: z.string().min(1).max(256),
  platform: z.string().min(1).max(32),
});

const subscriptionSchema = z.object({
  mangaId: z.string().min(1),
  kind: z.enum(['manga', 'book', 'comic']),
  title: z.string().min(1),
  coverUrl: z.string().nullable().optional(),
  lastKnownChapterId: z.string().nullable().optional(),
});

const subscriptionsSchema = z.object({
  items: z.array(subscriptionSchema).max(2000),
});

function splitSourceId(mangaId: string): { sourceId: string; rawId: string } {
  const index = mangaId.indexOf(':');
  if (index <= 0) return { sourceId: 'mangadex', rawId: mangaId };
  return { sourceId: mangaId.slice(0, index), rawId: mangaId.slice(index + 1) };
}

export const devicesRoutes = new Hono();

devicesRoutes.use('*', rateLimit(120, 60_000));

devicesRoutes.post('/', async (c) => {
  const parsed = deviceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', details: parsed.error.flatten() }, 400);
  }
  upsertDevice({
    id: parsed.data.deviceId,
    token: parsed.data.token,
    platform: parsed.data.platform,
  });
  return c.json({ ok: true });
});

devicesRoutes.delete('/:id', (c) => {
  deleteDevice(c.req.param('id'));
  return c.json({ ok: true });
});

devicesRoutes.put('/:id/subscriptions', async (c) => {
  const deviceId = c.req.param('id');
  if (!getDevice(deviceId)) {
    return c.json({ error: 'device_not_found' }, 404);
  }

  const parsed = subscriptionsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', details: parsed.error.flatten() }, 400);
  }

  const items = parsed.data.items.map((item) => {
    const { sourceId, rawId } = splitSourceId(item.mangaId);
    return {
      mangaId: item.mangaId,
      kind: item.kind,
      sourceId,
      rawId,
      title: item.title,
      coverUrl: item.coverUrl ?? null,
      lastKnownChapterId: item.lastKnownChapterId ?? null,
    };
  });

  replaceSubscriptions(deviceId, items);
  return c.json({ ok: true, count: items.length });
});
