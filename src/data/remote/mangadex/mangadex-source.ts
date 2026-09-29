import {
  HttpClient,
  MangaDexSource as SharedMangaDexSource,
  type ReaderContent,
} from '@manga-spawn/content-sources';

import { MANGADEX_API_URL, MANGADEX_REPORT_URL, USER_AGENT } from '@/core/config';
import { Chapter } from '@/domain/models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { SourceInfo } from '@/domain/models/settings';
import { MangaSource } from '@/domain/providers/manga-source';
import { SettingsRepository } from '@/domain/repositories/settings-repository';

export class MangaDexSource implements MangaSource {
  readonly info: SourceInfo;
  private readonly delegate: SharedMangaDexSource;

  constructor(
    settings: SettingsRepository,
    http: HttpClient = new HttpClient(MANGADEX_API_URL, { userAgent: USER_AGENT }),
  ) {
    this.delegate = new SharedMangaDexSource(http, {
      languages: async () => {
        const language = await settings.getLanguage();
        return language === 'all' ? [] : [language];
      },
      reportUrl: MANGADEX_REPORT_URL,
    });
    this.info = this.delegate.info;
  }

  search(filters: MangaSearchFilters, offset: number, limit: number): Promise<Page<Manga>> {
    return this.delegate.search(filters, offset, limit);
  }

  getManga(rawId: string): Promise<Manga> {
    return this.delegate.getContent(rawId);
  }

  getTags(): Promise<MangaTag[]> {
    return this.delegate.getTags();
  }

  getPopular(offset: number, limit: number): Promise<Page<Manga>> {
    return this.delegate.getPopular(offset, limit);
  }

  getLatest(offset: number, limit: number): Promise<Page<Manga>> {
    return this.delegate.getLatest(offset, limit);
  }

  getChapters(rawMangaId: string): Promise<Chapter[]> {
    return this.delegate.getReleases(rawMangaId);
  }

  getLatestChapter(rawMangaId: string): Promise<Chapter | null> {
    return this.delegate.getLatestRelease(rawMangaId);
  }

  getChapter(rawChapterId: string): Promise<Chapter> {
    return this.delegate.getRelease(rawChapterId);
  }

  getReader(rawChapterId: string): Promise<ReaderContent> {
    return this.delegate.getReader(rawChapterId);
  }

  reportPage(url: string, success: boolean, bytes: number, duration: number): Promise<void> {
    return this.delegate.reportPage(url, success, bytes, duration);
  }
}
