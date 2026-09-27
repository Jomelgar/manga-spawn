import { Chapter, ChapterPages } from '@/domain/models/chapter';
import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { SourceInfo } from '@/domain/models/settings';
import { MangaSource } from '@/domain/providers/manga-source';

import { WeebCentralClient } from './weebcentral-client';
import {
  buildCoverUrl,
  parseChapters,
  parsePages,
  parseSearch,
  parseSeries,
} from './weebcentral-parser';

const PAGE_SIZE = 32;
const MAX_RESULTS = 600;

export class WeebCentralSource implements MangaSource {
  readonly info: SourceInfo = {
    id: 'weebcentral',
    name: 'WeebCentral',
    languages: ['en'],
    description: 'Catálogo enorme en inglés (Weeb Central).',
  };

  constructor(private readonly client: WeebCentralClient) {}

  async search(filters: MangaSearchFilters, offset: number, _limit: number): Promise<Page<Manga>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams(filters.title ?? '', 'Best Match', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getManga(rawId: string): Promise<Manga> {
    const html = await this.client.fetchHtml(`/series/${rawId}`);
    const series = parseSeries(html);
    return {
      id: rawId,
      title: series.title,
      altTitles: [],
      description: series.description,
      status: 'unknown',
      year: null,
      contentRating: 'safe',
      publicationDemographic: null,
      tags: [],
      authors: series.authors,
      artists: [],
      coverUrl: series.coverUrl ?? buildCoverUrl(rawId),
      availableLanguages: ['en'],
      lastChapter: null,
      latestUploadedChapter: null,
    };
  }

  getTags(): Promise<MangaTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, _limit: number): Promise<Page<Manga>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams('', 'Popularity', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getLatest(offset: number, _limit: number): Promise<Page<Manga>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams('', 'Recently Added', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getChapters(rawMangaId: string): Promise<Chapter[]> {
    const html = await this.client.fetchHtml(`/series/${rawMangaId}/full-chapter-list`);
    return parseChapters(html, rawMangaId);
  }

  async getLatestChapter(rawMangaId: string): Promise<Chapter | null> {
    const chapters = await this.getChapters(rawMangaId);
    return chapters.at(-1) ?? null;
  }

  getChapter(rawChapterId: string): Promise<Chapter> {
    return Promise.resolve({
      id: rawChapterId,
      mangaId: '',
      title: null,
      chapter: null,
      volume: null,
      language: 'en',
      pages: 0,
      publishAt: '',
      readableAt: '',
      scanlationGroups: [],
    });
  }

  async getPages(rawChapterId: string): Promise<ChapterPages> {
    const html = await this.client.fetchHtml(
      `/chapters/${rawChapterId}/images?is_prev=False&current_page=1&reading_style=long_strip`,
      { hx: true },
    );
    const urls = parsePages(html);
    return {
      chapterId: rawChapterId,
      baseUrl: this.client.baseUrl,
      hash: '',
      pages: urls.map((url, index) => ({
        index,
        fileName: String(index),
        url,
      })),
    };
  }

  private searchParams(
    text: string,
    sort: string,
    offset: number,
  ): string {
    return new URLSearchParams({
      limit: String(PAGE_SIZE),
      text,
      sort,
      order: 'Descending',
      official: 'Any',
      display_mode: 'Minimal Display',
      anime: 'Any',
      adult: 'Any',
      offset: String(offset),
    }).toString();
  }

  private toPage(items: Manga[], offset: number): Page<Manga> {
    const pageSize = items.length;
    const next = offset + pageSize;
    const hasMore = pageSize > 0 && next < MAX_RESULTS;
    return {
      items,
      offset,
      limit: pageSize || PAGE_SIZE,
      total: hasMore ? next + 1 : next,
    };
  }
}
