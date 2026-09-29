import type { ContentSource } from '@manga-spawn/content-sources';

import { Chapter } from '@/domain/models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { MangaSource } from '@/domain/providers/manga-source';

export function adaptContentSource(delegate: ContentSource): MangaSource {
  const source: MangaSource = {
    info: delegate.info,
    search: (filters: MangaSearchFilters, offset: number, limit: number): Promise<Page<Manga>> =>
      delegate.search(filters, offset, limit),
    getManga: (rawId: string): Promise<Manga> => delegate.getContent(rawId),
    getTags: (): Promise<MangaTag[]> => delegate.getTags(),
    getPopular: (offset: number, limit: number): Promise<Page<Manga>> =>
      delegate.getPopular(offset, limit),
    getLatest: (offset: number, limit: number): Promise<Page<Manga>> =>
      delegate.getLatest(offset, limit),
    getChapters: (rawMangaId: string): Promise<Chapter[]> => delegate.getReleases(rawMangaId),
    getChapter: (rawChapterId: string): Promise<Chapter> => delegate.getRelease(rawChapterId),
    getReader: (rawChapterId: string) => delegate.getReader(rawChapterId),
  };

  if (delegate.getLatestRelease) {
    source.getLatestChapter = (rawMangaId: string): Promise<Chapter | null> =>
      delegate.getLatestRelease!(rawMangaId);
  }

  if (delegate.reportPage) {
    source.reportPage = (url, success, bytes, duration) =>
      delegate.reportPage!(url, success, bytes, duration);
  }

  return source;
}
