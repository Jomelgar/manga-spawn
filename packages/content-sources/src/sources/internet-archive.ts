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
const PAGE_SIZE = 32;

const LANGUAGE_MAP: Record<string, string> = {
  en: 'eng',
  es: 'spa',
  'es-la': 'spa',
  fr: 'fre',
  de: 'ger',
  pt: 'por',
  it: 'ita',
};

interface ArchiveSearchDoc {
  identifier: string;
  title?: string | string[];
  creator?: string | string[];
  year?: string | number;
  language?: string | string[];
  downloads?: number;
}

interface ArchiveSearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: ArchiveSearchDoc[];
  };
}

interface ArchiveFile {
  name: string;
  format?: string;
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
  };
  files?: ArchiveFile[];
}

export interface InternetArchiveSourceOptions {
  languages?: () => Promise<string[]>;
}

export class InternetArchiveSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'internet-archive',
    name: 'Internet Archive',
    kind: 'book',
    languages: ['en', 'es', 'fr', 'de', 'pt', 'it'],
    description: 'Millones de libros y textos de archive.org.',
    reader: 'text',
  };

  constructor(
    private readonly http: HttpClient = new HttpClient(BASE_URL),
    private readonly options: InternetArchiveSourceOptions = {},
  ) {}

  async search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>> {
    const clauses = ['mediatype:texts'];
    if (filters.title) clauses.push(`title:(${quote(filters.title)})`);
    const languages = await this.languages();
    if (languages.length > 0) {
      clauses.push(`language:(${languages.join(' OR ')})`);
    }
    return this.query(clauses.join(' AND '), 'downloads desc', offset, limit);
  }

  async getContent(rawId: string): Promise<Content> {
    const metadata = await this.metadata(rawId);
    return mapMetadata(rawId, metadata);
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Content>> {
    return this.query('mediatype:texts', 'downloads desc', offset, limit);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Content>> {
    return this.query('mediatype:texts', 'addeddate desc', offset, limit);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const metadata = await this.metadata(rawContentId);
    return [toRelease(rawContentId, metadata)];
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const [release] = await this.getReleases(rawContentId);
    return release ?? null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const metadata = await this.metadata(rawReleaseId);
    return toRelease(rawReleaseId, metadata);
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const metadata = await this.metadata(rawReleaseId);
    const textFile = (metadata.files ?? []).find(
      (file) => file.name.endsWith('_djvu.txt') || file.format === 'DjVuTXT',
    );
    if (!textFile) {
      throw new Error('Este texto de Internet Archive no tiene una versión de lectura disponible.');
    }
    const url = `${BASE_URL}/download/${rawReleaseId}/${textFile.name}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el texto (${response.status}).`);
    }
    return {
      type: 'text',
      releaseId: rawReleaseId,
      title: first(metadata.metadata?.title) ?? null,
      body: await response.text(),
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
          'fl[]': ['identifier', 'title', 'creator', 'year', 'language', 'downloads'],
          'sort[]': sort,
          rows: PAGE_SIZE,
          page: Math.floor(offset / PAGE_SIZE) + 1,
          output: 'json',
        },
      })
      .then((response) => ({
        items: response.response.docs.map(mapDoc),
        offset,
        limit: limit || PAGE_SIZE,
        total: response.response.numFound,
      }));
  }

  private metadata(identifier: string): Promise<ArchiveMetadata> {
    return this.http.get<ArchiveMetadata>(`/metadata/${identifier}`);
  }

  private async languages(): Promise<string[]> {
    if (!this.options.languages) return [];
    const languages = await this.options.languages();
    return languages
      .map((language) => LANGUAGE_MAP[language])
      .filter((code): code is string => Boolean(code));
  }
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function mapDoc(doc: ArchiveSearchDoc): Content {
  return {
    id: doc.identifier,
    kind: 'book',
    title: first(doc.title) ?? doc.identifier,
    altTitles: [],
    description: '',
    status: 'completed',
    year: doc.year ? Number(doc.year) || null : null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
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
    kind: 'book',
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

function toRelease(identifier: string, payload: ArchiveMetadata): Release {
  return {
    id: identifier,
    mangaId: identifier,
    title: first(payload.metadata?.title) ?? null,
    chapter: null,
    volume: null,
    language: first(payload.metadata?.language) ?? 'en',
    pages: 0,
    publishAt: '',
    readableAt: '',
    scanlationGroups: [],
  };
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
