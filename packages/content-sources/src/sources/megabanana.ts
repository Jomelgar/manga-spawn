import { HttpClient } from '../http';
import type {
  Content,
  ContentInfo,
  ContentSearchFilters,
  ContentTag,
  Page,
  ReaderContent,
  Release,
} from '../models';
import type { ContentSource } from '../content-source';
import { stripTags } from '../text';

const PAGE_SIZE = 30;

interface CatalogItem {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
  excerpt?: string;
  readerReady?: boolean;
  chapters?: string[];
  date?: string;
}

interface CatalogResponse {
  items: CatalogItem[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
}

interface ReaderChapter {
  number: string;
  title: string;
  pageCount: string;
}

interface ReaderResponse {
  postId: number;
  title: string;
  currentChapter: number;
  chapters: ReaderChapter[];
  pages: string[];
}

interface WpPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string }[] };
}

export class MegaBananaSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'megabanana',
    name: 'MegaBanana',
    kind: 'comic',
    languages: ['es'],
    description: 'Comics en español (Marvel, DC, Image y más).',
    reader: 'images',
  };

  constructor(private readonly http: HttpClient = new HttpClient('https://megabanana.mx')) {}

  search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>> {
    return this.catalog(filters.title, offset, limit);
  }

  async getContent(rawId: string): Promise<Content> {
    const post = await this.http.get<WpPost>(`/wp-json/wp/v2/posts/${rawId}?_embed`);
    return {
      id: String(post.id),
      kind: 'comic',
      title: cleanTitle(stripTags(post.title.rendered)),
      altTitles: [],
      description: stripTags(post.excerpt.rendered),
      status: 'ongoing',
      year: null,
      contentRating: 'safe',
      publicationDemographic: null,
      tags: [],
      authors: [],
      artists: [],
      coverUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
      availableLanguages: ['es'],
      lastChapter: null,
      latestUploadedChapter: null,
    };
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  getPopular(offset: number, limit: number): Promise<Page<Content>> {
    return this.catalog(undefined, offset, limit, 'comics');
  }

  getLatest(offset: number, limit: number): Promise<Page<Content>> {
    return this.catalog(undefined, offset, limit, 'comics');
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const reader = await this.reader(rawContentId);
    return reader.chapters.map((chapter) => toRelease(rawContentId, chapter));
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const releases = await this.getReleases(rawContentId);
    return releases.at(-1) ?? null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const parsed = parseReleaseId(rawReleaseId);
    if (!parsed) throw new Error(`Identificador inválido: ${rawReleaseId}`);
    return {
      id: rawReleaseId,
      mangaId: parsed.postId,
      title: `Capítulo ${parsed.chapter}`,
      chapter: parsed.chapter,
      volume: null,
      language: 'es',
      pages: 0,
      publishAt: '',
      readableAt: '',
      scanlationGroups: [],
    };
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const parsed = parseReleaseId(rawReleaseId);
    if (!parsed) throw new Error(`Identificador inválido: ${rawReleaseId}`);
    const reader = await this.reader(parsed.postId, parsed.chapter);
    if (reader.pages.length === 0) {
      throw new Error('No se encontraron páginas para este capítulo.');
    }
    return {
      type: 'images',
      releaseId: rawReleaseId,
      baseUrl: 'https://megabanana.mx',
      hash: '',
      pages: reader.pages.map((url, index) => ({ index, fileName: String(index), url })),
    };
  }

  private async catalog(
    search: string | undefined,
    offset: number,
    limit: number,
    category?: string,
  ): Promise<Page<Content>> {
    const response = await this.http.get<CatalogResponse>('/wp-json/megabanana/v1/catalog', {
      params: {
        per_page: PAGE_SIZE,
        page: Math.floor(offset / PAGE_SIZE) + 1,
        search: search?.trim() || undefined,
        category,
      },
    });
    const items = response.items
      .filter((item) => item.readerReady !== false)
      .map(mapItem);
    return {
      items,
      offset,
      limit: limit || PAGE_SIZE,
      total: response.total,
    };
  }

  private reader(postId: string, chapter?: string): Promise<ReaderResponse> {
    return this.http.get<ReaderResponse>(`/wp-json/megabanana/v1/reader/${postId}`, {
      params: chapter ? { chapter } : undefined,
    });
  }
}

export function parseReleaseId(rawReleaseId: string): { postId: string; chapter: string } | null {
  const separator = rawReleaseId.indexOf('~');
  if (separator <= 0) return null;
  return {
    postId: rawReleaseId.slice(0, separator),
    chapter: rawReleaseId.slice(separator + 1),
  };
}

function mapItem(item: CatalogItem): Content {
  return {
    id: String(item.id),
    kind: 'comic',
    title: cleanTitle(item.title),
    altTitles: [],
    description: item.excerpt ?? '',
    status: 'ongoing',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
    authors: [],
    artists: [],
    coverUrl: item.thumbnail ?? null,
    availableLanguages: ['es'],
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

function toRelease(postId: string, chapter: ReaderChapter): Release {
  return {
    id: `${postId}~${chapter.number}`,
    mangaId: postId,
    title: chapter.title || `Capítulo ${chapter.number}`,
    chapter: chapter.number,
    volume: null,
    language: 'es',
    pages: Number(chapter.pageCount) || 0,
    publishAt: '',
    readableAt: '',
    scanlationGroups: [],
  };
}

function cleanTitle(title: string): string {
  return title
    .replace(/^Leer\s+/i, '')
    .replace(/\s+Comic Online.*$/i, '')
    .trim();
}
