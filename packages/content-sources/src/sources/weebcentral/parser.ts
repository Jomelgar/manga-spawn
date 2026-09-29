import type { Content, Release } from '../../models';
import { decodeEntities, stripTags } from '../../text';

const COVER_BASE = 'https://temp.compsci88.com/cover/fallback';

export function buildCoverUrl(seriesId: string): string {
  return `${COVER_BASE}/${seriesId}.jpg`;
}

export function parseSearch(html: string): Content[] {
  const results: Content[] = [];
  const seen = new Set<string>();
  const pattern =
    /<a href="https:\/\/weebcentral\.com\/series\/([^/"]+)\/[^"]*"[^>]*data-tip="([^"]*)"/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const [, id, title] = match;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push(toContent(id, decodeEntities(title)));
  }

  return results;
}

function toContent(id: string, title: string): Content {
  return {
    id,
    kind: 'manga',
    title,
    altTitles: [],
    description: '',
    status: 'unknown',
    year: null,
    contentRating: 'safe',
    publicationDemographic: null,
    tags: [],
    authors: [],
    artists: [],
    coverUrl: buildCoverUrl(id),
    availableLanguages: ['en'],
    lastChapter: null,
    latestUploadedChapter: null,
  };
}

export interface ParsedSeries {
  title: string;
  coverUrl: string | null;
  description: string;
  authors: string[];
}

export function parseSeries(html: string): ParsedSeries {
  const titleMatch = html.match(/<title>([^<]+?)\s*\|\s*Weeb Central<\/title>/);
  const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  const descriptionMatch = html.match(
    /<p class="whitespace-pre-wrap break-words">([\s\S]*?)<\/p>/,
  );

  const authors: string[] = [];
  const authorPattern = /author=([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let authorMatch: RegExpExecArray | null;
  while ((authorMatch = authorPattern.exec(html)) !== null) {
    const name = decodeEntities(authorMatch[2]);
    if (name && !authors.includes(name)) authors.push(name);
  }

  return {
    title: titleMatch ? decodeEntities(titleMatch[1]) : 'Sin título',
    coverUrl: coverMatch ? coverMatch[1] : null,
    description: descriptionMatch ? stripTags(descriptionMatch[1]) : '',
    authors,
  };
}

function parseChapterNumber(label: string): string | null {
  const match = label.match(/([\d]+(?:\.[\d]+)?)/);
  return match ? match[1] : null;
}

export function parseReleases(html: string, mangaId: string): Release[] {
  const releases: Release[] = [];
  const anchorPattern = /<a href="\/chapters\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const [, id, inner] = match;
    const labels = [...inner.matchAll(/<span[^>]*>([^<]+)<\/span>/g)]
      .map((span) => decodeEntities(span[1]))
      .filter(Boolean);
    const label =
      labels.find((value) => /chapter/i.test(value)) ??
      labels.find((value) => /\d/.test(value)) ??
      '';

    releases.push({
      id,
      mangaId,
      title: label || null,
      chapter: label ? parseChapterNumber(label) : null,
      volume: null,
      language: 'en',
      pages: 0,
      publishAt: '',
      readableAt: '',
      scanlationGroups: [],
    });
  }

  return releases.reverse();
}

export function parsePages(html: string): string[] {
  const urls: string[] = [];
  const pattern = /<img[^>]*\bsrc="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const url = match[1];
    if (url.includes('/static/')) continue;
    if (!/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url)) continue;
    urls.push(url);
  }
  return urls;
}
