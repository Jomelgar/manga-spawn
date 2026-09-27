import { Manga, MangaSearchFilters, MangaTag, Page } from '../models/manga';

export interface MangaRepository {
  search(filters: MangaSearchFilters, offset: number, limit: number): Promise<Page<Manga>>;
  getById(id: string): Promise<Manga>;
  getTags(): Promise<MangaTag[]>;
  getPopular(offset: number, limit: number): Promise<Page<Manga>>;
  getLatest(offset: number, limit: number): Promise<Page<Manga>>;
}
