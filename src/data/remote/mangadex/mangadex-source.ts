import { Chapter, ChapterPages } from '@/domain/models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { SourceInfo } from '@/domain/models/settings';
import { MangaSource } from '@/domain/providers/manga-source';
import { SettingsRepository } from '@/domain/repositories/settings-repository';

import { MangaDexChapterDatasource } from './chapter-datasource';
import { MangaDexMangaDatasource } from './manga-datasource';
import { mapChapter, mapManga, mapTag } from './mappers';

const PAGE_QUALITY: 'data' | 'data-saver' = 'data-saver';

export class MangaDexSource implements MangaSource {
  readonly info: SourceInfo = {
    id: 'mangadex',
    name: 'MangaDex',
    languages: ['es', 'es-la', 'en'],
    description: 'Catálogo oficial con muchos idiomas.',
  };

  constructor(
    private readonly mangaDatasource: MangaDexMangaDatasource,
    private readonly chapterDatasource: MangaDexChapterDatasource,
    private readonly settings: SettingsRepository,
  ) {}

  async search(filters: MangaSearchFilters, offset: number, limit: number): Promise<Page<Manga>> {
    const response = await this.mangaDatasource.search(
      filters,
      offset,
      limit,
      await this.languages(),
    );
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getManga(rawId: string): Promise<Manga> {
    const response = await this.mangaDatasource.getById(rawId);
    return mapManga(response.data);
  }

  async getTags(): Promise<MangaTag[]> {
    const response = await this.mangaDatasource.getTags();
    return response.data.map(mapTag);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Manga>> {
    const response = await this.mangaDatasource.getPopular(offset, limit, await this.languages());
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Manga>> {
    const response = await this.mangaDatasource.getLatest(offset, limit, await this.languages());
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getChapters(rawMangaId: string): Promise<Chapter[]> {
    const response = await this.chapterDatasource.feed(
      rawMangaId,
      await this.languages(),
      'asc',
      500,
    );
    return response.data.map(mapChapter).map((chapter) => ({ ...chapter, mangaId: rawMangaId }));
  }

  async getLatestChapter(rawMangaId: string): Promise<Chapter | null> {
    const response = await this.chapterDatasource.feed(
      rawMangaId,
      await this.languages(),
      'desc',
      1,
    );
    const [first] = response.data;
    return first ? { ...mapChapter(first), mangaId: rawMangaId } : null;
  }

  async getChapter(rawChapterId: string): Promise<Chapter> {
    const response = await this.chapterDatasource.getById(rawChapterId);
    return mapChapter(response.data);
  }

  async getPages(rawChapterId: string): Promise<ChapterPages> {
    const atHome = await this.chapterDatasource.getAtHome(rawChapterId);
    const files = PAGE_QUALITY === 'data' ? atHome.chapter.data : atHome.chapter.dataSaver;
    const folder = PAGE_QUALITY === 'data' ? 'data' : 'data-saver';
    return {
      chapterId: rawChapterId,
      baseUrl: atHome.baseUrl,
      hash: atHome.chapter.hash,
      pages: files.map((fileName, index) => ({
        index,
        fileName,
        url: `${atHome.baseUrl}/${folder}/${atHome.chapter.hash}/${fileName}`,
      })),
    };
  }

  reportPage(url: string, success: boolean, bytes: number, duration: number): Promise<void> {
    return this.chapterDatasource.report(url, success, bytes, duration);
  }

  private async languages(): Promise<string[]> {
    const language = await this.settings.getLanguage();
    return language === 'all' ? [] : [language];
  }

  private toPage(
    data: Parameters<typeof mapManga>[0][],
    offset: number,
    limit: number,
    total?: number,
  ): Page<Manga> {
    return {
      items: data.map(mapManga),
      offset,
      limit,
      total: total ?? data.length,
    };
  }
}
