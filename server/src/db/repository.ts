import { db } from './client';

export interface DeviceRow {
  id: string;
  expo_token: string;
  platform: string;
  enabled: number;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface SubscriptionGroup {
  source_id: string;
  raw_id: string;
  kind: string;
  manga_id: string;
  title: string;
  last_known_release_id: string | null;
  device_count: number;
}

export interface SubscriptionInput {
  mangaId: string;
  kind: string;
  sourceId: string;
  rawId: string;
  title: string;
  coverUrl: string | null;
  lastKnownChapterId: string | null;
}

const now = () => new Date().toISOString();

export function upsertDevice(input: { id: string; token: string; platform: string }): void {
  const timestamp = now();
  db.prepare(
    `INSERT INTO devices (id, expo_token, platform, enabled, created_at, updated_at, last_seen_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       expo_token = excluded.expo_token,
       platform = excluded.platform,
       enabled = 1,
       updated_at = excluded.updated_at,
       last_seen_at = excluded.last_seen_at`,
  ).run(input.id, input.token, input.platform, timestamp, timestamp, timestamp);
}

export function deleteDevice(id: string): void {
  db.prepare('DELETE FROM devices WHERE id = ?').run(id);
}

export function getDevice(id: string): DeviceRow | undefined {
  return db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as unknown as DeviceRow | undefined;
}

export function listEnabledDevices(): DeviceRow[] {
  return db.prepare('SELECT * FROM devices WHERE enabled = 1').all() as unknown as DeviceRow[];
}

export function listDevicesByIds(ids: string[]): DeviceRow[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return db
    .prepare(`SELECT * FROM devices WHERE enabled = 1 AND id IN (${placeholders})`)
    .all(...ids) as unknown as DeviceRow[];
}

export function replaceSubscriptions(deviceId: string, items: SubscriptionInput[]): void {
  const timestamp = now();
  const insert = db.prepare(
    `INSERT INTO subscriptions
       (device_id, manga_id, kind, source_id, raw_id, title, cover_url, last_known_release_id, last_checked_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT(device_id, manga_id) DO UPDATE SET
       kind = excluded.kind,
       source_id = excluded.source_id,
       raw_id = excluded.raw_id,
       title = excluded.title,
       cover_url = excluded.cover_url,
       last_known_release_id = COALESCE(subscriptions.last_known_release_id, excluded.last_known_release_id)`,
  );
  const remove = db.prepare('DELETE FROM subscriptions WHERE device_id = ? AND manga_id = ?');
  const existing = db
    .prepare('SELECT manga_id FROM subscriptions WHERE device_id = ?')
    .all(deviceId) as unknown as { manga_id: string }[];

  const nextIds = new Set(items.map((item) => item.mangaId));

  db.exec('BEGIN');
  try {
    for (const row of existing) {
      if (!nextIds.has(row.manga_id)) remove.run(deviceId, row.manga_id);
    }
    for (const item of items) {
      insert.run(
        deviceId,
        item.mangaId,
        item.kind,
        item.sourceId,
        item.rawId,
        item.title,
        item.coverUrl,
        item.lastKnownChapterId,
        timestamp,
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function listSubscriptionGroups(): SubscriptionGroup[] {
  return db
    .prepare(
      `SELECT source_id,
              raw_id,
              kind,
              MIN(manga_id) AS manga_id,
              MIN(title) AS title,
              MAX(last_known_release_id) AS last_known_release_id,
              COUNT(DISTINCT device_id) AS device_count
       FROM subscriptions
       GROUP BY source_id, raw_id`,
    )
    .all() as unknown as SubscriptionGroup[];
}

export function listDevicesForManga(mangaId: string): DeviceRow[] {
  return db
    .prepare(
      `SELECT d.* FROM devices d
       JOIN subscriptions s ON s.device_id = d.id
       WHERE s.manga_id = ? AND d.enabled = 1`,
    )
    .all(mangaId) as unknown as DeviceRow[];
}

export function updateGroupRelease(sourceId: string, rawId: string, releaseId: string): void {
  db.prepare(
    `UPDATE subscriptions
     SET last_known_release_id = ?, last_checked_at = ?
     WHERE source_id = ? AND raw_id = ?`,
  ).run(releaseId, now(), sourceId, rawId);
}

export function insertTicket(id: string, deviceId: string): void {
  db.prepare('INSERT OR IGNORE INTO push_tickets (id, device_id, created_at) VALUES (?, ?, ?)').run(
    id,
    deviceId,
    now(),
  );
}

export function listTickets(): { id: string; device_id: string }[] {
  return db.prepare('SELECT id, device_id FROM push_tickets').all() as unknown as {
    id: string;
    device_id: string;
  }[];
}

export function deleteTickets(ids: string[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  db.prepare(`DELETE FROM push_tickets WHERE id IN (${placeholders})`).run(...ids);
}

export function disableDevice(id: string): void {
  db.prepare('UPDATE devices SET enabled = 0, updated_at = ? WHERE id = ?').run(now(), id);
}
