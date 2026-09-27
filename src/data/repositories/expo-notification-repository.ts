import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

import { MANGADEX_PUSH_URL, STORAGE_KEYS } from '@/core/config';
import { canUseNotifications } from '@/core/environment';
import {
  DEFAULT_WEEKLY_REMINDER,
  NewChapterAlert,
  PushTokenInfo,
  WeeklyReminderConfig,
} from '@/domain/models/notifications';
import { NotificationRepository } from '@/domain/repositories/notification-repository';

import { appStore, KeyValueStore, readJson, writeJson } from '../storage/key-value-store';

const WEEKLY_IDENTIFIER = 'weekly-reading-reminder';
const DEFAULT_CHANNEL = 'default';
const REMINDER_CHANNEL = 'reading-reminder';

type NotificationsModule = typeof NotificationsType;

let cachedModule: NotificationsModule | null = null;

/**
 * Loads `expo-notifications` lazily. Importing it at module scope crashes
 * Expo Go on Android (expo/expo#49044), so we only evaluate it on demand.
 */
function loadNotifications(): NotificationsModule {
  if (!cachedModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as NotificationsModule;
  }
  return cachedModule;
}

function extractUrl(response: NotificationsType.NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}

export class ExpoNotificationRepository implements NotificationRepository {
  constructor(private readonly store: KeyValueStore = appStore) {
    if (this.isSupported()) {
      this.initialize();
    }
  }

  private initialize(): void {
    loadNotifications().setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  isSupported(): boolean {
    return canUseNotifications();
  }

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (!this.isSupported()) return 'denied';
    const { status } = await loadNotifications().getPermissionsAsync();
    return normalizeStatus(status);
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (!this.isSupported()) return 'denied';
    await this.ensureChannels();
    const { status } = await loadNotifications().requestPermissionsAsync();
    return normalizeStatus(status);
  }

  async registerForPush(): Promise<PushTokenInfo | null> {
    if (!this.isSupported()) return null;

    await this.ensureChannels();
    const permission = await this.requestPermission();
    if (permission !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error(
        'Falta el projectId de EAS. Ejecuta "eas init" para habilitar notificaciones push remotas.',
      );
    }

    const token = (await loadNotifications().getExpoPushTokenAsync({ projectId })).data;
    const info: PushTokenInfo = {
      token,
      platform: Platform.OS,
      updatedAt: new Date().toISOString(),
    };
    await writeJson(this.store, STORAGE_KEYS.pushToken, info);
    return info;
  }

  getStoredToken(): Promise<PushTokenInfo | null> {
    return readJson<PushTokenInfo>(this.store, STORAGE_KEYS.pushToken);
  }

  async sendTestPush(token: string): Promise<void> {
    const response = await fetch(MANGADEX_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: 'manga-spawn',
        body: 'Notificación push de prueba enviada correctamente.',
        data: { url: '/' },
      }),
    });
    if (!response.ok) {
      throw new Error(`Expo Push Service respondió ${response.status}`);
    }
  }

  async scheduleLocalTest(title: string, body: string): Promise<void> {
    if (!this.isSupported()) return;
    const notifications = loadNotifications();
    await this.ensureChannels();
    await notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { url: '/' },
        ...(Platform.OS === 'android' ? { channelId: DEFAULT_CHANNEL } : {}),
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: DEFAULT_CHANNEL,
      },
    });
  }

  async getWeeklyReminder(): Promise<WeeklyReminderConfig> {
    return (
      (await readJson<WeeklyReminderConfig>(this.store, STORAGE_KEYS.weeklyReminder)) ??
      DEFAULT_WEEKLY_REMINDER
    );
  }

  async setWeeklyReminder(config: WeeklyReminderConfig): Promise<void> {
    await writeJson(this.store, STORAGE_KEYS.weeklyReminder, config);
    if (!config.enabled && this.isSupported()) {
      await loadNotifications().cancelScheduledNotificationAsync(WEEKLY_IDENTIFIER);
    }
  }

  async syncWeeklyReminder(title: string, body: string, url: string): Promise<void> {
    if (!this.isSupported()) return;
    const config = await this.getWeeklyReminder();
    if (!config.enabled) return;

    const notifications = loadNotifications();
    await this.ensureChannels();
    await notifications.scheduleNotificationAsync({
      identifier: WEEKLY_IDENTIFIER,
      content: {
        title,
        body,
        data: { url },
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : {}),
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: config.weekday,
        hour: config.hour,
        minute: config.minute,
        channelId: REMINDER_CHANNEL,
      },
    });
  }

  async notifyNewChapters(alerts: NewChapterAlert[]): Promise<void> {
    if (!this.isSupported() || alerts.length === 0) return;
    const notifications = loadNotifications();
    await this.ensureChannels();

    const single = alerts.length === 1 ? alerts[0] : null;
    const title = single ? 'Nuevo capítulo disponible' : `Nuevos capítulos (${alerts.length})`;
    const body = single
      ? `«${single.mangaTitle}»${single.chapterNumber ? ` cap. ${single.chapterNumber}` : ''} ya está disponible.`
      : alerts
          .slice(0, 3)
          .map((alert) => `«${alert.mangaTitle}»`)
          .join(', ')
          .concat(alerts.length > 3 ? ` y ${alerts.length - 3} más` : '');

    await notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { url: single ? `/manga/${single.mangaId}` : '/library' },
        ...(Platform.OS === 'android' ? { channelId: DEFAULT_CHANNEL } : {}),
      },
      trigger: null,
    });
  }

  async getInitialNotificationUrl(): Promise<string | null> {
    if (!this.isSupported()) return null;
    return extractUrl(loadNotifications().getLastNotificationResponse());
  }

  subscribeToNotificationResponses(onUrl: (url: string) => void): () => void {
    if (!this.isSupported()) return () => {};
    const subscription = loadNotifications().addNotificationResponseReceivedListener(
      (response) => {
        const url = extractUrl(response);
        if (url) onUrl(url);
      },
    );
    return () => subscription.remove();
  }

  private async ensureChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;
    const notifications = loadNotifications();
    await notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
      name: 'General',
      importance: notifications.AndroidImportance.HIGH,
    });
    await notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Recordatorio de lectura',
      importance: notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

function normalizeStatus(status: string): 'granted' | 'denied' | 'undetermined' {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}
