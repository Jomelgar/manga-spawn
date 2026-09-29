import {
  WeebCentralSource as SharedWeebCentralSource,
  type ReaderContent,
} from '@manga-spawn/content-sources';

import { Chapter } from '@/domain/models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { SourceInfo } from '@/domain/models/settings';
import { MangaSource } from '@/domain/providers/manga-source';

export class WeebCentralSource implements MangaSource {
  readonly info: SourceInfo;
  private readonly delegate = new SharedWeebCentralSource();

  constructor() {
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
}
