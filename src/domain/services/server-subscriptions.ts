import { ServerSubscription } from '../models/device';
import { FollowedManga } from '../models/reading-progress';

export function toServerSubscriptions(items: FollowedManga[]): ServerSubscription[] {
  return items.map((item) => ({
    mangaId: item.mangaId,
    kind: item.kind,
    title: item.title,
    coverUrl: item.coverUrl,
    lastKnownChapterId: item.lastKnownChapterId,
  }));
}
