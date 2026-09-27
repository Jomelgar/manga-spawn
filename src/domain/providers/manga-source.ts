import { Chapter, ChapterPages } from '../models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '../models/manga';
import { SourceInfo } from '../models/settings';

export interface MangaSource {
  readonly info: SourceInfo;

  search(filters: MangaSearchFilters, offset: number, limit: number): Promise<Page<Manga>>;
  getManga(rawId: string): Promise<Manga>;
  getTags(): Promise<MangaTag[]>;
  getPopular(offset: number, limit: number): Promise<Page<Manga>>;
  getLatest(offset: number, limit: number): Promise<Page<Manga>>;

  getChapters(rawMangaId: string): Promise<Chapter[]>;
  getChapter(rawChapterId: string): Promise<Chapter>;
  getPages(rawChapterId: string): Promise<ChapterPages>;
  getLatestChapter?(rawMangaId: string): Promise<Chapter | null>;

  reportPage?(url: string, success: boolean, bytes: number, duration: number): Promise<void>;
}
