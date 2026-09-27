import { FollowedManga, ReadingProgress } from '../models/reading-progress';

export interface LibraryRepository {
  listFollowed(): Promise<FollowedManga[]>;
  isFollowed(mangaId: string): Promise<boolean>;
  follow(manga: {
    mangaId: string;
    title: string;
    coverUrl: string | null;
    lastKnownChapterId: string | null;
    lastKnownChapterNumber: string | null;
  }): Promise<void>;
  unfollow(mangaId: string): Promise<void>;
  updateFollowedChapter(
    mangaId: string,
    chapterId: string,
    chapterNumber: string | null,
  ): Promise<void>;
  markChecked(mangaId: string): Promise<void>;
  saveProgress(progress: ReadingProgress): Promise<void>;
  getLastRead(): Promise<ReadingProgress | null>;
  getProgress(mangaId: string): Promise<ReadingProgress | null>;
}
