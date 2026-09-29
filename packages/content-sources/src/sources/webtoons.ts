import { ApiError, HttpClient } from '../http';
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
import { decodeEntities } from '../text';

const BASE_URL = 'https://www.webtoons.com';
const IMAGE_REFERER = 'https://www.webtoons.com/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface SeriesId {
  genre: string;
  titleSlug: string;
  titleNo: string;
}

interface EpisodeId extends SeriesId {
  episodeSlug: string;
  episodeNo: string;
}

export class WebtoonsSource implements ContentSource {
  readonly info: ContentInfo = {
    id: 'webtoons',
    name: 'WEBTOON',
    kind: 'comic',
    languages: ['en'],
    description: 'Webcomics oficiales de WEBTOON (verticales).',
    reader: 'images',
  };

  constructor(private readonly http: HttpClient = new HttpClient(BASE_URL)) {}

  async search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>> {
    const keyword = filters.title ?? '';
    const html = await this.fetchHtml(`/en/search?keyword=${encodeURIComponent(keyword)}`);
    return this.toPage(parseSeries(html), offset, limit);
  }

  async getContent(rawId: string): Promise<Content> {
    const id = parseSeriesId(rawId);
    const html = await this.fetchHtml(listPath(id));
    return parseDetail(html, id);
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, limit: number): Promise<Page<Content>> {
    const html = await this.fetchHtml('/en/genres');
    return this.toPage(parseSeries(html), offset, limit);
  }

  async getLatest(offset: number, limit: number): Promise<Page<Content>> {
    const html = await this.fetchHtml('/en/originals');
    return this.toPage(parseSeries(html), offset, limit);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const id = parseSeriesId(rawContentId);
    const html = await this.fetchHtml(listPath(id));
    return parseEpisodes(html).reverse();
  }

  async getLatestRelease(rawContentId: string): Promise<Release | null> {
    const releases = await this.getReleases(rawContentId);
    return releases.at(-1) ?? null;
  }

  async getRelease(rawReleaseId: string): Promise<Release> {
    const id = parseEpisodeId(rawReleaseId);
    return {
      id: rawReleaseId,
      mangaId: seriesIdOf(id),
      title: `Ep. ${id.episodeNo}`,
      chapter: id.episodeNo,
      volume: null,
      language: 'en',
      pages: 0,
      publishAt: '',
      readableAt: '',
      scanlationGroups: [],
    };
  }

  async getReader(rawReleaseId: string): Promise<ReaderContent> {
    const id = parseEpisodeId(rawReleaseId);
    const html = await this.fetchHtml(viewerPath(id));
    const urls = parseViewerImages(html);
    if (urls.length === 0) {
      throw new Error('No se encontraron imágenes para este episodio.');
    }
    return {
      type: 'images',
      releaseId: rawReleaseId,
      baseUrl: BASE_URL,
      hash: '',
      pages: urls.map((url, index) => ({
        index,
        fileName: String(index),
        url,
        headers: { Referer: IMAGE_REFERER },
      })),
    };
  }

  private async fetchHtml(path: string): Promise<string> {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!response.ok) {
      throw new ApiError(response.status, `Webtoons respondió ${response.status}`);
    }
    return response.text();
  }

  private toPage(items: Content[], offset: number, limit: number): Page<Content> {
    const pageSize = limit || items.length || 1;
    return {
      items: items.slice(offset, offset + pageSize),
      offset,
      limit: pageSize,
      total: items.length,
    };
  }
}

export function parseSeriesId(rawId: string): SeriesId {
  const [genre, titleSlug, titleNo] = rawId.split('~');
  if (!genre || !titleSlug || !titleNo) {
    throw new Error(`Identificador de serie inválido: ${rawId}`);
  }
  return { genre, titleSlug, titleNo };
}

export function parseEpisodeId(rawId: string): EpisodeId {
  const [genre, titleSlug, episodeSlug, titleNo, episodeNo] = rawId.split('~');
  if (!genre || !titleSlug || !episodeSlug || !titleNo || !episodeNo) {
    throw new Error(`Identificador de episodio inválido: ${rawId}`);
  }
  return { genre, titleSlug, episodeSlug, titleNo, episodeNo };
}

function seriesIdOf(id: SeriesId): string {
  return `${id.genre}~${id.titleSlug}~${id.titleNo}`;
}

function episodeIdOf(id: EpisodeId): string {
  return `${id.genre}~${id.titleSlug}~${id.episodeSlug}~${id.titleNo}~${id.episodeNo}`;
}

function listPath(id: SeriesId): string {
  return `/en/${id.genre}/${id.titleSlug}/list?title_no=${id.titleNo}`;
}

function viewerPath(id: EpisodeId): string {
  return `/en/${id.genre}/${id.titleSlug}/${id.episodeSlug}/viewer?title_no=${id.titleNo}&episode_no=${id.episodeNo}`;
}

function parseSeries(html: string): Content[] {
  const results: Content[] = [];
  const seen = new Set<string>();
  const pattern =
    /<a href="https:\/\/www\.webtoons\.com\/en\/([^/"?#]+)\/([^/"?#]+)\/list\?title_no=(\d+)"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const [, genre, titleSlug, titleNo, inner] = match;
    if (seen.has(titleNo)) continue;
    seen.add(titleNo);

    const cover = inner.match(/src="(https:\/\/[^"]*phinf\.pstatic\.net[^"]+)"/);
    const title = inner.match(/<strong class="title">([^<]*)<\/strong>/);
    const author = inner.match(/<div class="author">([^<]*)<\/div>/);

    results.push({
      id: `${genre}~${titleSlug}~${titleNo}`,
      kind: 'comic',
      title: title ? decodeEntities(title[1]) : titleSlug,
      altTitles: [],
      description: '',
      status: 'ongoing',
      year: null,
      contentRating: 'safe',
      publicationDemographic: null,
      tags: [],
      authors: author ? [decodeEntities(author[1])] : [],
      artists: [],
      coverUrl: cover ? cover[1] : null,
      coverHeaders: cover ? { Referer: IMAGE_REFERER } : undefined,
      availableLanguages: ['en'],
      lastChapter: null,
      latestUploadedChapter: null,
    });
  }

  return results;
}

function parseDetail(html: string, id: SeriesId): Content {
  const title = metaContent(html, 'og:title') ?? id.titleSlug;
  const description = metaContent(html, 'og:description') ?? '';
  const cover = metaContent(html, 'og:image');
  const author = html.match(/<div class="author">([^<]*)<\/div>/);

  return {
    id: seriesIdOf(id),
    kind: 'comic',
    title,
    altTitles: [],
    description,
    status: 'ongoing',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
    authors: author ? [decodeEntities(author[1])] : [],
    artists: [],
    coverUrl: cover,
    coverHeaders: cover ? { Referer: IMAGE_REFERER } : undefined,
    availableLanguages: ['en'],
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

function parseEpisodes(html: string): Release[] {
  const releases: Release[] = [];
  const seen = new Set<string>();
  const pattern =
    /<a href="https:\/\/www\.webtoons\.com\/en\/([^/]+)\/([^/]+)\/([^/]+)\/viewer\?title_no=(\d+)&(?:amp;)?episode_no=(\d+)"[^>]*class="detail_list_link"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const [, genre, titleSlug, episodeSlug, titleNo, episodeNo, inner] = match;
    if (seen.has(episodeNo)) continue;
    seen.add(episodeNo);

    const label = inner.match(/class="subj"><span>([^<]*)<\/span>/);
    const date = inner.match(/class="date">([^<]*)<\/span>/);

    releases.push({
      id: episodeIdOf({ genre, titleSlug, episodeSlug, titleNo, episodeNo }),
      mangaId: `${genre}~${titleSlug}~${titleNo}`,
      title: label ? decodeEntities(label[1]) : `Ep. ${episodeNo}`,
      chapter: episodeNo,
      volume: null,
      language: 'en',
      pages: 0,
      publishAt: '',
      readableAt: date ? decodeEntities(date[1]) : '',
      scanlationGroups: [],
    });
  }

  return releases;
}

function parseViewerImages(html: string): string[] {
  const start = html.indexOf('id="_imageList"');
  if (start < 0) return [];
  const end = html.indexOf('</div>', start);
  const section = html.slice(start, end < 0 ? undefined : end);

  const urls: string[] = [];
  const seen = new Set<string>();
  const pattern = /data-url="(https:\/\/[^"]*phinf\.pstatic\.net[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(section)) !== null) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function metaContent(html: string, property: string): string | null {
  const match = html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`));
  return match ? decodeEntities(match[1]) : null;
}
