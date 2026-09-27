export interface Chapter {
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

export interface ChapterPage {
  index: number;
  fileName: string;
  url: string;
  headers?: Record<string, string>;
}

export interface ChapterPages {
  chapterId: string;
  baseUrl: string;
  hash: string;
  pages: ChapterPage[];
}

export interface ChapterFeedParams {
  mangaId: string;
  languages?: string[];
  order?: 'asc' | 'desc';
}
