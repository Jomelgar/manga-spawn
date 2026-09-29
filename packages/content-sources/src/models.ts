export type ContentKind = 'manga' | 'book' | 'comic';

export type ReaderKind = 'images' | 'text' | 'html';

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'unknown';

export type ContentRating = 'safe' | 'suggestive' | 'erotica' | 'pornographic';

export type PublicationDemographic = 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none';

export interface ContentTag {
  id: string;
  name: string;
  group: string;
}

export interface Content {
  id: string;
  kind: ContentKind;
  title: string;
  altTitles: string[];
  description: string;
  status: MangaStatus;
  year: number | null;
  contentRating: ContentRating;
  publicationDemographic: PublicationDemographic | null;
  tags: ContentTag[];
  authors: string[];
  artists: string[];
  coverUrl: string | null;
  coverHeaders?: Record<string, string>;
  availableLanguages: string[];
  lastChapter: string | null;
  latestUploadedChapter: string | null;
}

export interface ContentSearchFilters {
  title?: string;
  includedTags?: string[];
  excludedTags?: string[];
  status?: MangaStatus[];
  contentRating?: ContentRating[];
  publicationDemographic?: PublicationDemographic[];
  order?: MangaOrder;
}

export type MangaOrderKey =
  | 'title'
  | 'year'
  | 'rating'
  | 'followedCount'
  | 'relevance'
  | 'latestUploadedChapter';

export type SortDirection = 'asc' | 'desc';

export type MangaOrder = Partial<Record<MangaOrderKey, SortDirection>>;

export interface Page<T> {
  items: T[];
  offset: number;
  limit: number;
  total: number;
}

export interface Release {
  id: string;
  mangaId: string;
  title: string | null;
  chapter: string | null;
  volume: string | null;
  language: string;
  pages: number;
  publishAt: string;
  readableAt: string;
  scanlationGroups: string[];
}

export interface ContentPage {
  index: number;
  fileName: string;
  url: string;
  headers?: Record<string, string>;
}

export interface ImageReaderContent {
  type: 'images';
  releaseId: string;
  baseUrl: string;
  hash: string;
  pages: ContentPage[];
}

export interface TextReaderContent {
  type: 'text';
  releaseId: string;
  title: string | null;
  body: string;
}

export interface HtmlReaderContent {
  type: 'html';
  releaseId: string;
  title: string | null;
  body: string;
}

export type ReaderContent = ImageReaderContent | TextReaderContent | HtmlReaderContent;

export interface ContentInfo {
  id: string;
  name: string;
  kind: ContentKind;
  languages: string[];
  description: string;
  reader: ReaderKind;
}
