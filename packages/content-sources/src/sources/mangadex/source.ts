import type { HttpClient } from '../../http';
import type { Content, ContentInfo, ContentSearchFilters, ContentTag, Page, ReaderContent, Release } from '../../models';
import type { ContentSource } from '../../content-source';

import { MangaDexChapterDatasource, MangaDexMangaDatasource } from './datasources';
import { mapContent, mapRelease, mapTag } from './mappers';

const PAGE_QUALITY: 'data' | 'data-saver' = 'data-saver';

export interface MangaDexSourceOptions {
  languages?: () => Promise<string[]>;
  reportUrl?: string;
}

export class MangaDexSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'mangadex',
    name: 'MangaDex',
    kind: 'manga',
    languages: ['es', 'es-la', 'en'],
    description: 'Catálogo oficial con muchos idiomas.',
    reader: 'images',
  };

  private readonly mangaDatasource: MangaDexMangaDatasource;
  private readonly chapterDatasource: MangaDexChapterDatasource;

  constructor(
    http: HttpClient,
    private readonly options: MangaDexSourceOptions = {},
  ) {
    this.mangaDatasource = new MangaDexMangaDatasource(http);
    this.chapterDatasource = new MangaDexChapterDatasource(http);
  }

  async search(
    filters: ContentSearchFilters,
    offset: number,
    limit: number,
  ): Promise<Page<Content>> {
    const response = await this.mangaDatasource.search(
      filters,
      offset,
      limit,
      await this.languages(),
    );
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getContent(rawId: string): Promise<Content> {
    const response = await this.mangaDatasource.getById(rawId);
    return mapContent(response.data);
  }

  async getTags(): Promise<ContentTag[]> {
    const response = await this.mangaDatasource.getTags();
    return response.data.map(mapTag);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Content>> {
    const response = await this.mangaDatasource.getPopular(offset, limit, await this.languages());
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Content>> {
    const response = await this.mangaDatasource.getLatest(offset, limit, await this.languages());
    return this.toPage(response.data, response.offset ?? offset, response.limit ?? limit, response.total);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const response = await this.chapterDatasource.feed(
      rawContentId,
      await this.languages(),
      'asc',
      500,
    );
    return response.data
      .map(mapRelease)
      .map((release) => ({ ...release, mangaId: rawContentId }));
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const response = await this.chapterDatasource.feed(
      rawContentId,
      await this.languages(),
      'desc',
      1,
    );
    const [first] = response.data;
    return first ? { ...mapRelease(first), mangaId: rawContentId } : null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const response = await this.chapterDatasource.getById(rawReleaseId);
    return mapRelease(response.data);
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const atHome = await this.chapterDatasource.getAtHome(rawReleaseId);
    const files = PAGE_QUALITY === 'data' ? atHome.chapter.data : atHome.chapter.dataSaver;
    const folder = PAGE_QUALITY === 'data' ? 'data' : 'data-saver';
    return {
      type: 'images',
      releaseId: rawReleaseId,
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
    if (!this.options.reportUrl) return Promise.resolve();
    return this.chapterDatasource.report(this.options.reportUrl, url, success, bytes, duration);
  }

  private async languages(): Promise<string[]> {
    if (!this.options.languages) return ['en'];
    return this.options.languages();
  }

  private toPage(
    data: Parameters<typeof mapContent>[0][],
    offset: number,
    limit: number,
    total?: number,
  ): Page<Content> {
    return {
      items: data.map(mapContent),
      offset,
      limit,
      total: total ?? data.length,
    };
  }
}
