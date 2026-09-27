export interface WeeklyReminderConfig {
  enabled: boolean;
  weekday: number;
  hour: number;
  minute: number;
}

export const DEFAULT_WEEKLY_REMINDER: WeeklyReminderConfig = {
  enabled: true,
  weekday: 7,
  hour: 10,
  minute: 0,
};

export interface NewChapterAlert {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber: string | null;
}

export interface PushTokenInfo {
  token: string;
  platform: string;
  updatedAt: string;
}
