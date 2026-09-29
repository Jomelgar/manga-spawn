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

const BASE_URL = 'https://archive.org';
const PAGE_SIZE = 24;

interface ArchiveComicDoc {
  identifier: string;
  title?: string | string[];
  creator?: string | string[];
  year?: string | number;
  language?: string | string[];
  subject?: string | string[];
  imagecount?: string | number;
  downloads?: number;
  'access-restricted-item'?: string;
}

interface ArchiveSearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: ArchiveComicDoc[];
  };
}

interface ArchiveMetadata {
  metadata?: {
    identifier?: string;
    title?: string | string[];
    creator?: string | string[];
    description?: string | string[];
    language?: string | string[];
    subject?: string | string[];
    year?: string | number;
    imagecount?: string | number;
    'access-restricted-item'?: string | boolean;
  };
  files?: { name: string }[];
}

export class InternetArchiveComicsSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'internet-archive-comics',
    name: 'Internet Archive (comics)',
    kind: 'comic',
    languages: ['en'],
    description: 'Comics y revistas clásicas de editoriales en archive.org.',
    reader: 'images',
  };

  constructor(private readonly http: HttpClient = new HttpClient(BASE_URL)) {}

  async search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>> {
    const title = filters.title?.trim();
    const q = title
      ? `collection:comics AND mediatype:texts AND title:(${quote(title)})`
      : 'collection:comics AND mediatype:texts';
    return this.query(q, 'downloads desc', offset, limit);
  }

  async getContent(rawId: string): Promise<Content> {
    const metadata = await this.metadata(rawId);
    ensureAccessible(metadata);
    return mapMetadata(rawId, metadata);
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Content>> {
    return this.query('collection:comics AND mediatype:texts', 'downloads desc', offset, limit);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Content>> {
    return this.query('collection:comics AND mediatype:texts', 'addeddate desc', offset, limit);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const metadata = await this.metadata(rawContentId);
    const pages = await this.resolvePageCount(rawContentId, metadata);
    return [toRelease(rawContentId, metadata, pages)];
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const [release] = await this.getReleases(rawContentId);
    return release ?? null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const metadata = await this.metadata(rawReleaseId);
    const pages = await this.resolvePageCount(rawReleaseId, metadata);
    return toRelease(rawReleaseId, metadata, pages);
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const metadata = await this.metadata(rawReleaseId);
    ensureAccessible(metadata);
    const pages = await this.resolvePageCount(rawReleaseId, metadata);
    if (pages <= 0) {
      throw new Error('Este comic no tiene páginas disponibles.');
    }
    return {
      type: 'images',
      releaseId: rawReleaseId,
      baseUrl: BASE_URL,
      hash: '',
      pages: Array.from({ length: pages }, (_, index) => ({
        index,
        fileName: String(index),
        url: `${BASE_URL}/download/${rawReleaseId}/page/n${index}.jpg`,
      })),
    };
  }

  private query(
    q: string,
    sort: string,
    offset: number,
    limit: number,
  ): Promise<Page<Content>> {
    return this.http
      .get<ArchiveSearchResponse>('/advancedsearch.php', {
        params: {
          q,
          'fl[]': [
            'identifier',
            'title',
            'creator',
            'year',
            'language',
            'subject',
            'imagecount',
            'downloads',
            'access-restricted-item',
          ],
          'sort[]': sort,
          rows: PAGE_SIZE,
          page: Math.floor(offset / PAGE_SIZE) + 1,
          output: 'json',
        },
      })
      .then((response) => {
        const items = response.response.docs
          .filter((doc) => doc['access-restricted-item'] !== 'true')
          .map(mapDoc);
        return {
          items,
          offset,
          limit: limit || PAGE_SIZE,
          total: response.response.numFound,
        };
      });
  }

  private metadata(identifier: string): Promise<ArchiveMetadata> {
    return this.http.get<ArchiveMetadata>(`/metadata/${identifier}`);
  }

  private async resolvePageCount(
    identifier: string,
    metadata: ArchiveMetadata,
  ): Promise<number> {
    const direct = pageCount(metadata);
    if (direct > 0) return direct;

    const file = (metadata.files ?? []).find((entry) => entry.name.endsWith('_page_numbers.json'));
    if (!file) return 0;

    try {
      const url = `${BASE_URL}/download/${identifier}/${encodeURIComponent(file.name)}`;
      const payload = await this.http.get<{ pages?: unknown[] }>(url);
      return Array.isArray(payload.pages) ? payload.pages.length : 0;
    } catch {
      return 0;
    }
  }
}

function ensureAccessible(metadata: ArchiveMetadata): void {
  const restricted = metadata.metadata?.['access-restricted-item'];
  if (restricted === true || restricted === 'true') {
    throw new Error('Este comic está restringido y no se puede leer libremente.');
  }
}

function pageCount(metadata: ArchiveMetadata): number {
  const raw = metadata.metadata?.imagecount;
  const count = raw ? Number(raw) : 0;
  return Number.isFinite(count) ? count : 0;
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function mapDoc(doc: ArchiveComicDoc): Content {
  return {
    id: doc.identifier,
    kind: 'comic',
    title: first(doc.title) ?? doc.identifier,
    altTitles: [],
    description: '',
    status: 'completed',
    year: doc.year ? Number(doc.year) || null : null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: toArray(doc.subject)
      .slice(0, 8)
      .map((subject) => ({ id: subject, name: subject, group: 'subject' })),
    authors: toArray(doc.creator),
    artists: [],
    coverUrl: `${BASE_URL}/services/img/${doc.identifier}`,
    availableLanguages: toArray(doc.language),
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

function mapMetadata(identifier: string, payload: ArchiveMetadata): Content {
  const metadata = payload.metadata ?? {};
  return {
    id: identifier,
    kind: 'comic',
    title: first(metadata.title) ?? identifier,
    altTitles: [],
    description: stripTags(first(metadata.description) ?? ''),
    status: 'completed',
    year: metadata.year ? Number(metadata.year) || null : null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: toArray(metadata.subject)
      .slice(0, 8)
      .map((subject) => ({ id: subject, name: subject, group: 'subject' })),
    authors: toArray(metadata.creator),
    artists: [],
    coverUrl: `${BASE_URL}/services/img/${identifier}`,
    availableLanguages: toArray(metadata.language),
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

function toRelease(identifier: string, payload: ArchiveMetadata, pages: number): Release {
  return {
    id: identifier,
    mangaId: identifier,
    title: first(payload.metadata?.title) ?? null,
    chapter: null,
    volume: null,
    language: first(payload.metadata?.language) ?? 'en',
    pages,
    publishAt: '',
    readableAt: '',
    scanlationGroups: [],
  };
}
