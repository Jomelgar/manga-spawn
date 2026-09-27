import { STORAGE_KEYS } from '@/core/config';
import {
  DEFAULT_WEEKLY_REMINDER,
  NewChapterAlert,
  PushTokenInfo,
  WeeklyReminderConfig,
} from '@/domain/models/notifications';
import { NotificationRepository } from '@/domain/repositories/notification-repository';

import { appStore, KeyValueStore, readJson, writeJson } from '../storage/key-value-store';

export class NoopNotificationRepository implements NotificationRepository {
  constructor(private readonly store: KeyValueStore = appStore) {}

  isSupported(): boolean {
    return false;
  }

  getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return Promise.resolve('denied');
  }

  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    return Promise.resolve('denied');
  }

  registerForPush(): Promise<PushTokenInfo | null> {
    return Promise.resolve(null);
  }

  getStoredToken(): Promise<PushTokenInfo | null> {
    return Promise.resolve(null);
  }

  sendTestPush(): Promise<void> {
    return Promise.reject(
      new Error('Las notificaciones no están disponibles en este entorno.'),
    );
  }

  scheduleLocalTest(): Promise<void> {
    return Promise.resolve();
  }

  async getWeeklyReminder(): Promise<WeeklyReminderConfig> {
    return (
      (await readJson<WeeklyReminderConfig>(this.store, STORAGE_KEYS.weeklyReminder)) ??
      DEFAULT_WEEKLY_REMINDER
    );
  }

  async setWeeklyReminder(config: WeeklyReminderConfig): Promise<void> {
    await writeJson(this.store, STORAGE_KEYS.weeklyReminder, config);
  }

  syncWeeklyReminder(): Promise<void> {
    return Promise.resolve();
  }

  notifyNewChapters(_alerts: NewChapterAlert[]): Promise<void> {
    return Promise.resolve();
  }

  getInitialNotificationUrl(): Promise<string | null> {
    return Promise.resolve(null);
  }

  subscribeToNotificationResponses(): () => void {
    return () => {};
  }
}
