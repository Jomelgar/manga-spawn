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
import { normalizeWhitespace } from '../text';

const BASE_URL = 'https://gutendex.com';
const PAGE_SIZE = 32;

interface GutendexPerson {
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexPerson[];
  translators: GutendexPerson[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
  summaries?: string[];
}

interface GutendexList {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export interface GutenbergSourceOptions {
  languages?: () => Promise<string[]>;
}

export class GutenbergSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'gutenberg',
    name: 'Project Gutenberg',
    kind: 'book',
    languages: ['en', 'es', 'fr', 'de', 'pt', 'it'],
    description: 'Más de 70.000 libros de dominio público (Gutendex).',
    reader: 'text',
  };

  constructor(
    private readonly http: HttpClient = new HttpClient(BASE_URL),
    private readonly options: GutenbergSourceOptions = {},
  ) {}

  async search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>> {
    const response = await this.http.get<GutendexList>('/books', {
      params: {
        search: filters.title,
        languages: await this.languages(),
        sort: 'popular',
        page: pageOf(offset),
      },
    });
    return this.toPage(response, offset, limit);
  }

  async getContent(rawId: string): Promise<Content> {
    const book = await this.http.get<GutendexBook>(`/books/${rawId}`);
    return mapBook(book);
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Content>> {
    const response = await this.http.get<GutendexList>('/books', {
      params: {
        languages: await this.languages(),
        sort: 'popular',
        page: pageOf(offset),
      },
    });
    return this.toPage(response, offset, limit);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Content>> {
    const response = await this.http.get<GutendexList>('/books', {
      params: {
        languages: await this.languages(),
        sort: 'descending',
        page: pageOf(offset),
      },
    });
    return this.toPage(response, offset, limit);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const book = await this.http.get<GutendexBook>(`/books/${rawContentId}`);
    return [toRelease(book)];
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const [release] = await this.getReleases(rawContentId);
    return release ?? null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const book = await this.http.get<GutendexBook>(`/books/${rawReleaseId}`);
    return toRelease(book);
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const book = await this.http.get<GutendexBook>(`/books/${rawReleaseId}`);
    const textUrl = pickFormat(book.formats, 'text/plain');
    if (textUrl) {
      const body = await fetchText(textUrl);
      return {
        type: 'text',
        releaseId: rawReleaseId,
        title: book.title,
        body: normalizeWhitespace(body),
      };
    }

    const htmlUrl = pickFormat(book.formats, 'text/html');
    if (htmlUrl) {
      const body = await fetchText(htmlUrl);
      return { type: 'html', releaseId: rawReleaseId, title: book.title, body };
    }

    throw new Error('Este libro no tiene un formato de lectura compatible.');
  }

  private async languages(): Promise<string[]> {
    if (!this.options.languages) return ['en'];
    const languages = await this.options.languages();
    return languages.length > 0 ? languages : ['en'];
  }

  private toPage(response: GutendexList, offset: number, limit: number): Page<Content> {
    return {
      items: response.results.map(mapBook),
      offset,
      limit: limit || PAGE_SIZE,
      total: response.count,
    };
  }
}

function pageOf(offset: number): number {
  return Math.floor(offset / PAGE_SIZE) + 1;
}

function pickFormat(formats: Record<string, string>, mime: string): string | undefined {
  const key = Object.keys(formats).find((candidate) => candidate.startsWith(mime));
  return key ? formats[key] : undefined;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar el libro (${response.status}).`);
  }
  return response.text();
}

function mapBook(book: GutendexBook): Content {
  const cover = book.formats['image/jpeg'];
  return {
    id: String(book.id),
    kind: 'book',
    title: book.title,
    altTitles: [],
    description: book.summaries?.[0] ?? '',
    status: 'completed',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: book.subjects.slice(0, 8).map((subject) => ({
      id: subject,
      name: subject,
      group: 'subject',
    })),
    authors: book.authors.map((author) => author.name),
    artists: [],
    coverUrl: cover ?? null,
    availableLanguages: book.languages,
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

function toRelease(book: GutendexBook): Release {
  return {
    id: String(book.id),
    mangaId: String(book.id),
    title: book.title,
    chapter: null,
    volume: null,
    language: book.languages[0] ?? 'en',
    pages: 0,
    publishAt: '',
    readableAt: '',
    scanlationGroups: [],
  };
}
