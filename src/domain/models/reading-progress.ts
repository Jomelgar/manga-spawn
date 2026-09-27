export interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string | null;
  chapterId: string;
  chapterNumber: string | null;
  page: number;
  updatedAt: string;
}

export interface FollowedManga {
  mangaId: string;
  title: string;
  coverUrl: string | null;
  lastKnownChapterId: string | null;
  lastKnownChapterNumber: string | null;
  followedAt: string;
  lastCheckedAt: string | null;
}
