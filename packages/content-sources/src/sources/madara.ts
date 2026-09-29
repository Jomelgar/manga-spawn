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
import { decodeEntities, stripTags } from '../text';

export interface MadaraSourceOptions {
  id: string;
  name: string;
  baseUrl: string;
  languages?: string[];
  description?: string;
}

export class MadaraSource implements ContentSource {
  readonly info: ContentInfo;
  private readonly baseUrl: string;

  constructor(options: MadaraSourceOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.info = {
      id: options.id,
      name: options.name,
      kind: 'comic',
      languages: options.languages ?? ['es'],
      description: options.description ?? 'Comics en español (Madara).',
      reader: 'images',
    };
  }

  async search(filters: ContentSearchFilters, offset: number, _limit: number): Promise<Page<Content>> {
    const keyword = filters.title?.trim() ?? '';
    const html = await this.fetchHtml(`/?s=${encodeURIComponent(keyword)}&post_type=wp-manga`);
    return singlePage(parseListing(html), offset);
  }

  async getContent(rawId: string): Promise<Content> {
    const html = await this.fetchHtml(`/comic/${rawId}/`);
    return parseDetail(html, rawId);
  }

  getTags(): Promise<ContentTag[]> {
    return Promise.resolve([]);
  }

  async getPopular(offset: number, _limit: number): Promise<Page<Content>> {
    const html = await this.fetchHtml('/comic/');
    return singlePage(parseListing(html), offset);
  }

  async getLatest(offset: number, _limit: number): Promise<Page<Content>> {
    const html = await this.fetchHtml('/?post_type=wp-manga&orderby=latest');
    return singlePage(parseListing(html), offset);
  }

  async getReleases(rawContentId: string): Promise<Release[]> {
    const response = await fetch(`${this.baseUrl}/comic/${rawContentId}/ajax/chapters/`, {
      method: 'POST',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });
    if (!response.ok) return [];
    return parseChapters(await response.text(), rawContentId).reverse();
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
      mangaId: parsed.slug,
      title: humanize(parsed.issue),
      chapter: parseNumber(parsed.issue),
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
    const html = await this.fetchHtml(`/comic/${parsed.slug}/${parsed.issue}/`);
    const urls = parseReaderImages(html);
    if (urls.length === 0) {
      throw new Error('No se encontraron páginas para este capítulo.');
    }
    return {
      type: 'images',
      releaseId: rawReleaseId,
      baseUrl: this.baseUrl,
      hash: '',
      pages: urls.map((url, index) => ({ index, fileName: String(index), url })),
    };
  }

  private async fetchHtml(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    if (!response.ok) {
      throw new Error(`${this.info.name} respondió ${response.status}`);
    }
    return response.text();
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export function parseReleaseId(rawReleaseId: string): { slug: string; issue: string } | null {
  const separator = rawReleaseId.indexOf('~');
  if (separator <= 0) return null;
  return {
    slug: rawReleaseId.slice(0, separator),
    issue: rawReleaseId.slice(separator + 1),
  };
}

function singlePage(items: Content[], offset: number): Page<Content> {
  return { items, offset, limit: items.length || 1, total: items.length };
}

function toContent(slug: string, title: string, coverUrl: string | null): Content {
  return {
    id: slug,
    kind: 'comic',
    title,
    altTitles: [],
    description: '',
    status: 'ongoing',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
    authors: [],
    artists: [],
    coverUrl,
    availableLanguages: ['es'],
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

export function parseListing(html: string): Content[] {
  const results: Content[] = [];
  const seen = new Set<string>();
  const blocks = html.split('data-post-id="');

  for (const block of blocks.slice(1)) {
    const anchor = block.match(
      /<a\s+href="[^"]*\/comic\/([^/"]+)\/([^/"]*)\/?"[^>]*title="([^"]*)"/,
    );
    if (!anchor) continue;
    const slug = anchor[1];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const cover = block.match(/data-src="([^"]+)"/);
    results.push(toContent(slug, decodeEntities(anchor[3]) || humanize(slug), cover ? cover[1] : null));
  }

  return results;
}

export function parseDetail(html: string, slug: string): Content {
  const title = metaContent(html, 'og:title') ?? humanize(slug);
  const cover = metaContent(html, 'og:image');
  const description = metaContent(html, 'og:description') ?? '';

  return {
    id: slug,
    kind: 'comic',
    title,
    altTitles: [],
    description,
    status: 'ongoing',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
    authors: [],
    artists: [],
    coverUrl: cover,
    availableLanguages: ['es'],
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

export function parseChapters(html: string, slug: string): Release[] {
  const releases: Release[] = [];
  const seen = new Set<string>();
  const pattern = /<a href="[^"]*\/comic\/[^/"]+\/([^/"]+)\/"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const issue = match[1];
    if (seen.has(issue)) continue;
    seen.add(issue);

    const label = stripTags(match[2]);
    const after = html.slice(match.index + match[0].length, match.index + match[0].length + 400);
    const date = after.match(/chapter-release-date[^>]*>\s*<i>([^<]*)</);

    releases.push({
      id: `${slug}~${issue}`,
      mangaId: slug,
      title: label || humanize(issue),
      chapter: parseNumber(label) ?? parseNumber(issue),
      volume: null,
      language: 'es',
      pages: 0,
      publishAt: '',
      readableAt: date ? date[1].trim() : '',
      scanlationGroups: [],
    });
  }

  return releases;
}

export function parseReaderImages(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const pattern = /<img[^>]*wp-manga-chapter-img[^>]*>/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const dataSrc = match[0].match(/data-src="([^"]+)"/);
    if (!dataSrc) continue;
    const url = dataSrc[1].replace(/\s+/g, '').replace(/^http:\/\//, 'https://');
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

function parseNumber(value: string): string | null {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

function humanize(slug: string): string {
  return slug
    .replace(/-\d{4}$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
