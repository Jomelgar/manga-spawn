import * as Crypto from 'expo-crypto';

import { NOTIFICATIONS_API_URL, STORAGE_KEYS } from '@/core/config';
import { PendingSync, ServerSubscription } from '@/domain/models/device';
import { NotificationRepository } from '@/domain/repositories/notification-repository';
import { PushRegistrationRepository } from '@/domain/repositories/push-registration-repository';

import { appStore, KeyValueStore, readJson, writeJson } from '../storage/key-value-store';

const EMPTY_PENDING: PendingSync = {
  device: null,
  subscriptions: [],
  dirty: false,
  updatedAt: '',
};

export class LocalFirstPushRegistrationRepository implements PushRegistrationRepository {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly store: KeyValueStore = appStore,
    private readonly apiUrl: string = NOTIFICATIONS_API_URL,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.apiUrl) && this.notifications.isSupported();
  }

  async getDeviceId(): Promise<string> {
    const existing = await this.store.getItem(STORAGE_KEYS.deviceId);
    if (existing) return existing;
    const id = Crypto.randomUUID();
    await this.store.setItem(STORAGE_KEYS.deviceId, id);
    return id;
  }

  async syncSubscriptions(items: ServerSubscription[]): Promise<void> {
    if (!this.isEnabled()) return;
    const pending = (await this.readPending()) ?? EMPTY_PENDING;
    await this.writePending({
      ...pending,
      subscriptions: items,
      dirty: true,
      updatedAt: new Date().toISOString(),
    });
    await this.sync();
  }

  async sync(): Promise<void> {
    if (!this.isEnabled()) return;
    const pending = (await this.readPending()) ?? EMPTY_PENDING;

    let tokenInfo = await this.notifications.getStoredToken();
    if (!tokenInfo) {
      tokenInfo = await this.notifications.registerForPush().catch(() => null);
    }
    if (!tokenInfo) return;

    const deviceId = await this.getDeviceId();
    const device = {
      deviceId,
      token: tokenInfo.token,
      platform: tokenInfo.platform,
    };

    try {
      await this.request('POST', '/v1/devices', device);
      await this.request('PUT', `/v1/devices/${deviceId}/subscriptions`, {
        items: pending.subscriptions,
      });
      await this.writePending({
        device,
        subscriptions: pending.subscriptions,
        dirty: false,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      await this.writePending({
        ...pending,
        device,
        dirty: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async unregister(): Promise<void> {
    if (!this.apiUrl) return;
    const deviceId = await this.getDeviceId();
    try {
      await fetch(`${this.apiUrl}/v1/devices/${deviceId}`, { method: 'DELETE' });
    } catch {
      return;
    }
  }

  private readPending(): Promise<PendingSync | null> {
    return readJson<PendingSync>(this.store, STORAGE_KEYS.syncOutbox);
  }

  private writePending(value: PendingSync): Promise<void> {
    return writeJson(this.store, STORAGE_KEYS.syncOutbox, value);
  }

  private async request(method: string, path: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Push API respondió ${response.status}`);
    }
    return response.json();
  }
}
