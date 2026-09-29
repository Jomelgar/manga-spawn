export interface MangaDexResponse<T> {
  result: 'ok' | 'error';
  response: 'entity' | 'collection';
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
  errors?: MangaDexError[];
}

export interface MangaDexError {
  id: string;
  status: number;
  title: string;
  detail: string;
}

export interface LocalizedString {
  [locale: string]: string;
}

export interface MangaRelationshipDto {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface TagDto {
  id: string;
  type: 'tag';
  attributes: {
    name: LocalizedString;
    group: string;
  };
}

export interface MangaAttributesDto {
  title: LocalizedString;
  altTitles: LocalizedString[];
  description: LocalizedString;
  status: string;
  year: number | null;
  contentRating: string;
  publicationDemographic: string | null;
  tags: TagDto[];
  availableTranslatedLanguages: string[];
  lastChapter: string | null;
  latestUploadedChapter: string | null;
}

export interface MangaDto {
  id: string;
  type: 'manga';
  attributes: MangaAttributesDto;
  relationships: MangaRelationshipDto[];
}

export interface ChapterAttributesDto {
  title: string | null;
  volume: string | null;
  chapter: string | null;
  pages: number;
  translatedLanguage: string;
  publishAt: string;
  readableAt: string;
}

export interface ChapterDto {
  id: string;
  type: 'chapter';
  attributes: ChapterAttributesDto;
  relationships: MangaRelationshipDto[];
}

export interface AtHomeDto {
  result: string;
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface TokenDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}
