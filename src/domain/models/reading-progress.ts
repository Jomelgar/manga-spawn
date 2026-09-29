import type { ContentKind } from '@manga-spawn/content-sources';

export interface ReadingProgress {
  mangaId: string;
  kind: ContentKind;
  mangaTitle: string;
  coverUrl: string | null;
  coverHeaders?: Record<string, string>;
  chapterId: string;
  chapterNumber: string | null;
  page: number;
  updatedAt: string;
}

export interface FollowedManga {
  mangaId: string;
  kind: ContentKind;
  title: string;
  coverUrl: string | null;
  coverHeaders?: Record<string, string>;
  lastKnownChapterId: string | null;
  lastKnownChapterNumber: string | null;
  followedAt: string;
  lastCheckedAt: string | null;
}
