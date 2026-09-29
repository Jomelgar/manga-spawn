import {
  GutenbergSource,
  HttpClient,
  InternetArchiveComicsSource,
  InternetArchiveSource,
  MadaraSource,
  MegaBananaSource,
  WebtoonsSource,
} from '@manga-spawn/content-sources';

import { MANGA_API_BASE, USER_AGENT } from '@/core/config';
import { canUseNotifications, isWeb } from '@/core/environment';
import { adaptContentSource } from '@/data/remote/content-source-adapter';
import { languageProvider } from '@/data/remote/language-provider';
import { MangaDexAuthDatasource } from '@/data/remote/mangadex/auth-datasource';
import { MangaDexSource } from '@/data/remote/mangadex/mangadex-source';
import { WeebCentralSource } from '@/data/remote/weebcentral/weebcentral-source';
import { ExpoNotificationRepository } from '@/data/repositories/expo-notification-repository';
import { LocalFirstPushRegistrationRepository } from '@/data/repositories/local-first-push-registration-repository';
import { NoopNotificationRepository } from '@/data/repositories/noop-notification-repository';
import { NoopPushRegistrationRepository } from '@/data/repositories/noop-push-registration-repository';
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
import { PushRegistrationRepository } from '@/domain/repositories/push-registration-repository';
import { SettingsRepository } from '@/domain/repositories/settings-repository';

import { SourceRegistry } from './source-registry';

export interface Repositories {
  manga: MangaRepository;
  chapter: ChapterRepository;
  library: LibraryRepository;
  auth: AuthRepository;
  notifications: NotificationRepository;
  pushRegistration: PushRegistrationRepository;
  settings: SettingsRepository;
  sources: SourceRegistry;
}

let singleton: Repositories | null = null;

export function createRepositories(): Repositories {
  if (singleton) return singleton;

  const http = new HttpClient(MANGA_API_BASE, { userAgent: USER_AGENT });
  const auth = new StorageAuthRepository(new MangaDexAuthDatasource(http));
  http.setTokenProvider(() => auth.getValidAccessToken());

  const settings = new StorageSettingsRepository();

  const languages = languageProvider(settings);
  const sources = new SourceRegistry(
    [
      new MangaDexSource(settings, http),
      ...(isWeb ? [] : [new WeebCentralSource()]),
      adaptContentSource(new GutenbergSource(undefined, { languages })),
      adaptContentSource(new InternetArchiveSource(undefined, { languages })),
      adaptContentSource(
        new MadaraSource({
          id: 'marmota',
          name: 'Marmota Comics',
          baseUrl: 'https://marmota.me',
          languages: ['es'],
        }),
      ),
      adaptContentSource(new MegaBananaSource()),
      adaptContentSource(new WebtoonsSource()),
      adaptContentSource(new InternetArchiveComicsSource()),
    ],
    settings,
  );

  const notifications = canUseNotifications()
    ? new ExpoNotificationRepository()
    : new NoopNotificationRepository();

  const pushRegistration = notifications.isSupported()
    ? new LocalFirstPushRegistrationRepository(notifications)
    : new NoopPushRegistrationRepository();

  singleton = {
    manga: new RoutedMangaRepository(sources),
    chapter: new RoutedChapterRepository(sources),
    library: new StorageLibraryRepository(),
    auth,
    notifications,
    pushRegistration,
    settings,
    sources,
  };

  return singleton;
}
