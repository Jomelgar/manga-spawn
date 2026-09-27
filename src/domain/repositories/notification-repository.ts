import { NewChapterAlert, PushTokenInfo, WeeklyReminderConfig } from '../models/notifications';

export interface NotificationRepository {
  isSupported(): boolean;
  getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  registerForPush(): Promise<PushTokenInfo | null>;
  getStoredToken(): Promise<PushTokenInfo | null>;
  sendTestPush(token: string): Promise<void>;
  scheduleLocalTest(title: string, body: string): Promise<void>;
  getWeeklyReminder(): Promise<WeeklyReminderConfig>;
  setWeeklyReminder(config: WeeklyReminderConfig): Promise<void>;
  syncWeeklyReminder(title: string, body: string, url: string): Promise<void>;
  notifyNewChapters(alerts: NewChapterAlert[]): Promise<void>;
  getInitialNotificationUrl(): Promise<string | null>;
  subscribeToNotificationResponses(onUrl: (url: string) => void): () => void;
}
