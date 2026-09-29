import type { ContentKind } from './models/manga';

export const DEFAULT_SOURCE_ID = 'mangadex';

export const DEFAULT_SOURCE_IDS: Record<ContentKind, string> = {
  manga: 'mangadex',
  book: 'gutenberg',
  comic: 'marmota',
};

export const CONTENT_KINDS: ContentKind[] = ['manga', 'book', 'comic'];

export interface ParsedSourceId {
  sourceId: string;
  rawId: string;
}

export function withSource(sourceId: string, rawId: string): string {
  return `${sourceId}:${rawId}`;
}

export function parseSourceId(id: string): ParsedSourceId {
  const separator = id.indexOf(':');
  if (separator <= 0) {
    return { sourceId: DEFAULT_SOURCE_ID, rawId: id };
  }
  return { sourceId: id.slice(0, separator), rawId: id.slice(separator + 1) };
}
