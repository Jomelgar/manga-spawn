import { Platform } from 'react-native';

export const MANGADEX_API_URL = 'https://api.mangadex.org';
export const MANGADEX_AUTH_URL =
  'https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token';
export const MANGADEX_UPLOADS_URL = 'https://uploads.mangadex.org';
export const MANGADEX_REPORT_URL = 'https://api.mangadex.network/report';
export const MANGADEX_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const USER_AGENT = 'manga-spawn/1.0.0 (https://github.com/manga-spawn)';

export const LOCALE_FALLBACK = 'en';

const webProxy = process.env.EXPO_PUBLIC_MANGADEX_PROXY;

export const MANGA_API_BASE =
  Platform.OS === 'web' && webProxy ? webProxy : MANGADEX_API_URL;

export const NOTIFICATIONS_API_URL =
  process.env.EXPO_PUBLIC_NOTIFICATIONS_API_URL ?? '';

export const STORAGE_KEYS = {
  session: 'manga-spawn.session',
  mangadexConnection: 'manga-spawn.mangadex-connection',
  followed: 'manga-spawn.followed',
  progress: 'manga-spawn.progress',
  weeklyReminder: 'manga-spawn.weekly-reminder',
  pushToken: 'manga-spawn.push-token',
  language: 'manga-spawn.language',
  activeSource: 'manga-spawn.active-source',
  readerSettings: 'manga-spawn.reader-settings',
  deviceId: 'manga-spawn.device-id',
  syncOutbox: 'manga-spawn.sync-outbox',
  pushRegistration: 'manga-spawn.push-registration',
} as const;
