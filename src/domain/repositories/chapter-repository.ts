import { Chapter, ChapterFeedParams, ChapterPages } from '../models/chapter';

export interface ChapterRepository {
  getById(id: string): Promise<Chapter>;
  getFeed(params: ChapterFeedParams): Promise<Chapter[]>;
  getLatestChapter(mangaId: string, languages?: string[]): Promise<Chapter | null>;
  getPages(chapterId: string, quality?: 'data' | 'data-saver'): Promise<ChapterPages>;
  reportPage(url: string, success: boolean, bytes: number, duration: number): Promise<void>;
}
