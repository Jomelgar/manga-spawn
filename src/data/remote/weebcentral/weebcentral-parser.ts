import { Chapter } from '@/domain/models/chapter';
import { Manga } from '@/domain/models/manga';

const COVER_BASE = 'https://temp.compsci88.com/cover/fallback';

export function buildCoverUrl(seriesId: string): string {
  return `${COVER_BASE}/${seriesId}.jpg`;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ''));
}

export function parseSearch(html: string): Manga[] {
  const results: Manga[] = [];
  const seen = new Set<string>();
  const pattern =
    /<a href="https:\/\/weebcentral\.com\/series\/([^/"]+)\/[^"]*"[^>]*data-tip="([^"]*)"/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const [, id, title] = match;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push(toManga(id, decodeEntities(title)));
  }

  return results;
}

function toManga(id: string, title: string): Manga {
  return {
    id,
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

export function parseChapters(html: string, mangaId: string): Chapter[] {
  const chapters: Chapter[] = [];
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

    chapters.push({
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

  return chapters.reverse();
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
