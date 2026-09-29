import type { ContentKind } from '@manga-spawn/content-sources';

import { Manga, MangaSearchFilters, MangaTag, Page } from '../models/manga';

export interface MangaRepository {
  search(
    filters: MangaSearchFilters,
    offset: number,
    limit: number,
    kind?: ContentKind,
  ): Promise<Page<Manga>>;
  getById(id: string): Promise<Manga>;
  getTags(kind?: ContentKind): Promise<MangaTag[]>;
  getPopular(offset: number, limit: number, kind?: ContentKind): Promise<Page<Manga>>;
  getLatest(offset: number, limit: number, kind?: ContentKind): Promise<Page<Manga>>;
}
