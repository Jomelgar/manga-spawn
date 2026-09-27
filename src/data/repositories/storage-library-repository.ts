import { STORAGE_KEYS } from '@/core/config';
import { FollowedManga, ReadingProgress } from '@/domain/models/reading-progress';
import { LibraryRepository } from '@/domain/repositories/library-repository';

import { appStore, KeyValueStore, readJson, writeJson } from '../storage/key-value-store';

interface ProgressState {
  byManga: Record<string, ReadingProgress>;
  lastReadId: string | null;
}

const EMPTY_PROGRESS: ProgressState = { byManga: {}, lastReadId: null };

export class StorageLibraryRepository implements LibraryRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly store: KeyValueStore = appStore) {}

  async listFollowed(): Promise<FollowedManga[]> {
    return (await readJson<FollowedManga[]>(this.store, STORAGE_KEYS.followed)) ?? [];
  }

  async isFollowed(mangaId: string): Promise<boolean> {
    const followed = await this.listFollowed();
    return followed.some((item) => item.mangaId === mangaId);
  }

  follow(manga: {
    mangaId: string;
    title: string;
    coverUrl: string | null;
    lastKnownChapterId: string | null;
    lastKnownChapterNumber: string | null;
  }): Promise<void> {
    return this.mutateFollowed((followed) => {
      const entry: FollowedManga = {
        ...manga,
        followedAt: new Date().toISOString(),
        lastCheckedAt: null,
      };
      return [entry, ...followed.filter((item) => item.mangaId !== manga.mangaId)];
    });
  }

  unfollow(mangaId: string): Promise<void> {
    return this.mutateFollowed((followed) =>
      followed.filter((item) => item.mangaId !== mangaId),
    );
  }

  updateFollowedChapter(
    mangaId: string,
    chapterId: string,
    chapterNumber: string | null,
  ): Promise<void> {
    return this.mutateFollowed((followed) =>
      followed.map((item) =>
        item.mangaId === mangaId
          ? { ...item, lastKnownChapterId: chapterId, lastKnownChapterNumber: chapterNumber }
          : item,
      ),
    );
  }

  markChecked(mangaId: string): Promise<void> {
    return this.mutateFollowed((followed) =>
      followed.map((item) =>
        item.mangaId === mangaId ? { ...item, lastCheckedAt: new Date().toISOString() } : item,
      ),
    );
  }

  saveProgress(progress: ReadingProgress): Promise<void> {
    return this.mutateProgress((state) => ({
      byManga: { ...state.byManga, [progress.mangaId]: progress },
      lastReadId: progress.mangaId,
    }));
  }

  async getLastRead(): Promise<ReadingProgress | null> {
    const state = await this.readProgress();
    if (!state.lastReadId) return null;
    return state.byManga[state.lastReadId] ?? null;
  }

  async getProgress(mangaId: string): Promise<ReadingProgress | null> {
    const state = await this.readProgress();
    return state.byManga[mangaId] ?? null;
  }

  private readProgress(): Promise<ProgressState> {
    return readJson<ProgressState>(this.store, STORAGE_KEYS.progress).then(
      (state) => state ?? EMPTY_PROGRESS,
    );
  }

  private mutateFollowed(
    updater: (followed: FollowedManga[]) => FollowedManga[],
  ): Promise<void> {
    return this.enqueue(async () => {
      const current = await this.listFollowed();
      await writeJson(this.store, STORAGE_KEYS.followed, updater(current));
    });
  }

  private mutateProgress(updater: (state: ProgressState) => ProgressState): Promise<void> {
    return this.enqueue(async () => {
      const current = await this.readProgress();
      await writeJson(this.store, STORAGE_KEYS.progress, updater(current));
    });
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(task);
    this.writeQueue = run.catch(() => undefined);
    return run;
  }
}
