import type { Content, ContentInfo, ContentSearchFilters, ContentTag, Page, ReaderContent, Release } from '../../models';
import type { ContentSource } from '../../content-source';

import { WeebCentralClient } from './client';
import { buildCoverUrl, parsePages, parseReleases, parseSearch, parseSeries } from './parser';

const PAGE_SIZE = 32;
const MAX_RESULTS = 600;

export class WeebCentralSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'weebcentral',
    name: 'WeebCentral',
    kind: 'manga',
    languages: ['en'],
    description: 'Catálogo enorme en inglés (Weeb Central).',
    reader: 'images',
  };

  constructor(private readonly client: WeebCentralClient = new WeebCentralClient()) {}

  async search(filters: ContentSearchFilters, offset: number, _limit: number): Promise<Page<Content>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams(filters.title ?? '', 'Best Match', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getContent(rawId: string): Promise<Content> {
    const html = await this.client.fetchHtml(`/series/${rawId}`);
    const series = parseSeries(html);
    return {
      id: rawId,
      kind: 'manga',
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

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, _limit: number): Promise<Page<Content>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams('', 'Popularity', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getLatest(offset: number, _limit: number): Promise<Page<Content>> {
    const html = await this.client.fetchHtml(
      `/search/data?${this.searchParams('', 'Recently Added', offset)}`,
    );
    return this.toPage(parseSearch(html), offset);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const html = await this.client.fetchHtml(`/series/${rawContentId}/full-chapter-list`);
    return parseReleases(html, rawContentId);
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const releases = await this.getReleases(rawContentId);
    return releases.at(-1) ?? null;
  }

  getRelease(rawReleaseId: string): Promise<Release> {
    return Promise.resolve({
      id: rawReleaseId,
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

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const html = await this.client.fetchHtml(
      `/chapters/${rawReleaseId}/images?is_prev=False&current_page=1&reading_style=long_strip`,
      { hx: true },
    );
    const urls = parsePages(html);
    return {
      type: 'images',
      releaseId: rawReleaseId,
      baseUrl: this.client.baseUrl,
      hash: '',
      pages: urls.map((url, index) => ({
        index,
        fileName: String(index),
        url,
      })),
    };
  }

  private searchParams(text: string, sort: string, offset: number): string {
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

  private toPage(items: Content[], offset: number): Page<Content> {
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
