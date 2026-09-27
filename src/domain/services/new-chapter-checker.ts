import { NewChapterAlert } from '../models/notifications';
import { ChapterRepository } from '../repositories/chapter-repository';
import { LibraryRepository } from '../repositories/library-repository';
import { NotificationRepository } from '../repositories/notification-repository';

const MIN_INTERVAL_MS = 1000 * 60 * 60 * 6;
const MAX_CHECKS_PER_RUN = 20;

export interface NewChapterCheckResult {
  alerts: NewChapterAlert[];
  checked: number;
}

export class NewChapterChecker {
  constructor(
    private readonly chapterRepository: ChapterRepository,
    private readonly libraryRepository: LibraryRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async run(force = false): Promise<NewChapterCheckResult> {
    const followed = await this.libraryRepository.listFollowed();
    const alerts: NewChapterAlert[] = [];
    let checked = 0;

    for (const item of followed) {
      if (checked >= MAX_CHECKS_PER_RUN) break;
      if (!force && item.lastCheckedAt) {
        const elapsed = Date.now() - Date.parse(item.lastCheckedAt);
        if (elapsed < MIN_INTERVAL_MS) continue;
      }

      const latest = await this.chapterRepository.getLatestChapter(item.mangaId);
      checked += 1;

      if (!latest) {
        await this.libraryRepository.markChecked(item.mangaId);
        continue;
      }

      const isNew = Boolean(item.lastKnownChapterId) && latest.id !== item.lastKnownChapterId;
      if (isNew) {
        alerts.push({
          mangaId: item.mangaId,
          mangaTitle: item.title,
          chapterId: latest.id,
          chapterNumber: latest.chapter,
        });
      }

      if (isNew || !item.lastKnownChapterId) {
        await this.libraryRepository.updateFollowedChapter(
          item.mangaId,
          latest.id,
          latest.chapter,
        );
      }
      await this.libraryRepository.markChecked(item.mangaId);
    }

    if (alerts.length > 0) {
      await this.notificationRepository.notifyNewChapters(alerts);
    }

    return { alerts, checked };
  }
}
