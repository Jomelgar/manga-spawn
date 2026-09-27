import { MANGA_API_BASE } from '@/core/config';
import { canUseNotifications, isWeb } from '@/core/environment';
import { MangaDexAuthDatasource } from '@/data/remote/mangadex/auth-datasource';
import { MangaDexChapterDatasource } from '@/data/remote/mangadex/chapter-datasource';
import { HttpClient } from '@/data/remote/mangadex/http-client';
import { MangaDexMangaDatasource } from '@/data/remote/mangadex/manga-datasource';
import { MangaDexSource } from '@/data/remote/mangadex/mangadex-source';
import { WeebCentralClient } from '@/data/remote/weebcentral/weebcentral-client';
import { WeebCentralSource } from '@/data/remote/weebcentral/weebcentral-source';
import { ExpoNotificationRepository } from '@/data/repositories/expo-notification-repository';
import { NoopNotificationRepository } from '@/data/repositories/noop-notification-repository';
import { RoutedChapterRepository } from '@/data/repositories/routed-chapter-repository';
import { RoutedMangaRepository } from '@/data/repositories/routed-manga-repository';
import { StorageAuthRepository } from '@/data/repositories/storage-auth-repository';
import { StorageLibraryRepository } from '@/data/repositories/storage-library-repository';
import { StorageSettingsRepository } from '@/data/repositories/storage-settings-repository';
import { AuthRepository } from '@/domain/repositories/auth-repository';
import { ChapterRepository } from '@/domain/repositories/chapter-repository';
import { LibraryRepository } from '@/domain/repositories/library-repository';
import { MangaRepository } from '@/domain/repositories/manga-repository';
import { NotificationRepository } from '@/domain/repositories/notification-repository';
import { SettingsRepository } from '@/domain/repositories/settings-repository';

import { SourceRegistry } from './source-registry';

export interface Repositories {
  manga: MangaRepository;
  chapter: ChapterRepository;
  library: LibraryRepository;
  auth: AuthRepository;
  notifications: NotificationRepository;
  settings: SettingsRepository;
  sources: SourceRegistry;
}

let singleton: Repositories | null = null;

export function createRepositories(): Repositories {
  if (singleton) return singleton;

  const http = new HttpClient(MANGA_API_BASE);
  const auth = new StorageAuthRepository(new MangaDexAuthDatasource(http));
  http.setTokenProvider(() => auth.getValidAccessToken());

  const settings = new StorageSettingsRepository();
  const mangaDatasource = new MangaDexMangaDatasource(http);
  const chapterDatasource = new MangaDexChapterDatasource(http);

  const sources = new SourceRegistry(
    [
      new MangaDexSource(mangaDatasource, chapterDatasource, settings),
      ...(isWeb ? [] : [new WeebCentralSource(new WeebCentralClient())]),
    ],
    settings,
  );

  singleton = {
    manga: new RoutedMangaRepository(sources),
    chapter: new RoutedChapterRepository(sources),
    library: new StorageLibraryRepository(),
    auth,
    notifications: canUseNotifications()
      ? new ExpoNotificationRepository()
      : new NoopNotificationRepository(),
    settings,
    sources,
  };

  return singleton;
}
