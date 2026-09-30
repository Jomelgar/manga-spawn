import { Hono } from 'hono';
import { z } from 'zod';

import { config } from '../config';
import { getDevice, listDevicesByIds, listEnabledDevices } from '../db/repository';
import { sendPush } from '../services/expo-push';

const announceSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  deviceIds: z.array(z.string()).optional(),
});

export const adminRoutes = new Hono();

adminRoutes.use('*', async (c, next) => {
  const key = c.req.header('x-admin-key') ?? c.req.query('key');
  if (!config.adminApiKey || key !== config.adminApiKey) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

adminRoutes.get('/hello', async (c) => {
  const devices = listEnabledDevices();
  const sent = await sendPush(
    devices.map((device) => ({ deviceId: device.id, token: device.expo_token })),
    {
      title: 'Hola 👋',
      body: 'Saludo desde tu servidor de manga-spawn.',
      data: { url: '/' },
    },
  );
  return c.json({ ok: true, sent, devices: devices.length });
});

adminRoutes.post('/announce', async (c) => {
  const parsed = announceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', details: parsed.error.flatten() }, 400);
  }

  const { title, body, url, deviceIds } = parsed.data;
  const devices = deviceIds?.length ? listDevicesByIds(deviceIds) : listEnabledDevices();
  const sent = await sendPush(
    devices.map((device) => ({ deviceId: device.id, token: device.expo_token })),
    { title, body, data: url ? { url } : undefined },
  );
  return c.json({ ok: true, sent });
});

adminRoutes.post('/notify/:deviceId', async (c) => {
  const parsed = announceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', details: parsed.error.flatten() }, 400);
  }

  const device = getDevice(c.req.param('deviceId'));
  if (!device) {
    return c.json({ error: 'device_not_found' }, 404);
  }

  const sent = await sendPush([{ deviceId: device.id, token: device.expo_token }], {
    title: parsed.data.title,
    body: parsed.data.body,
    data: parsed.data.url ? { url: parsed.data.url } : undefined,
  });
  return c.json({ ok: true, sent });
});
