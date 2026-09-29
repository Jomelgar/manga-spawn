export type {
  Release as Chapter,
  ContentPage as ChapterPage,
} from '@manga-spawn/content-sources';

export interface ChapterPages {
  chapterId: string;
  baseUrl: string;
  hash: string;
  pages: import('@manga-spawn/content-sources').ContentPage[];
}

export interface ChapterFeedParams {
  mangaId: string;
  languages?: string[];
  order?: 'asc' | 'desc';
}
