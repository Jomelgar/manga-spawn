import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { config } from './config';
import { adminRoutes } from './routes/admin';
import { devicesRoutes } from './routes/devices';

export const app = new Hono();

app.use('*', cors({ origin: config.corsOrigin }));

app.get('/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route('/v1/devices', devicesRoutes);
app.route('/v1/admin', adminRoutes);
