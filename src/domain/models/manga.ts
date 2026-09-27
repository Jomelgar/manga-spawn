export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'unknown';

export type ContentRating = 'safe' | 'suggestive' | 'erotica' | 'pornographic';

export type PublicationDemographic = 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none';

export interface MangaTag {
  id: string;
  name: string;
  group: string;
}

export interface Manga {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: MangaStatus;
  year: number | null;
  contentRating: ContentRating;
  publicationDemographic: PublicationDemographic | null;
  tags: MangaTag[];
  authors: string[];
  artists: string[];
  coverUrl: string | null;
  availableLanguages: string[];
  lastChapter: string | null;
  latestUploadedChapter: string | null;
}

export interface MangaSearchFilters {
  title?: string;
  includedTags?: string[];
  excludedTags?: string[];
  status?: MangaStatus[];
  contentRating?: ContentRating[];
  publicationDemographic?: PublicationDemographic[];
  order?: MangaOrder;
}

export type MangaOrderKey = 'title' | 'year' | 'rating' | 'followedCount' | 'relevance' | 'latestUploadedChapter';

export type SortDirection = 'asc' | 'desc';

export type MangaOrder = Partial<Record<MangaOrderKey, SortDirection>>;

export interface Page<T> {
  items: T[];
  offset: number;
  limit: number;
  total: number;
}
