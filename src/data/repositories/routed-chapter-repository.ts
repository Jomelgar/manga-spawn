import { ReaderContent } from '@manga-spawn/content-sources';

import { Chapter, ChapterFeedParams } from '@/domain/models/chapter';
import { ChapterRepository } from '@/domain/repositories/chapter-repository';
import { parseSourceId, withSource } from '@/domain/source-id';

import { SourceRegistry } from '@/core/di/source-registry';

function prefixChapter(sourceId: string, chapter: Chapter): Chapter {
  return {
    ...chapter,
    id: withSource(sourceId, chapter.id),
    mangaId: chapter.mangaId ? withSource(sourceId, chapter.mangaId) : chapter.mangaId,
  };
}

export class RoutedChapterRepository implements ChapterRepository {
  constructor(private readonly registry: SourceRegistry) {}

  async getById(id: string): Promise<Chapter> {
    const { sourceId, rawId } = parseSourceId(id);
    const source = await this.resolve(sourceId);
    return prefixChapter(source.info.id, await source.getChapter(rawId));
  }

  async getFeed(params: ChapterFeedParams): Promise<Chapter[]> {
    const { sourceId, rawId } = parseSourceId(params.mangaId);
    const source = await this.resolve(sourceId);
    const chapters = await source.getChapters(rawId);
    return chapters.map((chapter) => prefixChapter(source.info.id, chapter));
  }

  async getLatestChapter(mangaId: string, _languages?: string[]): Promise<Chapter | null> {
    const { sourceId, rawId } = parseSourceId(mangaId);
    const source = await this.resolve(sourceId);
    const chapter = source.getLatestChapter
      ? await source.getLatestChapter(rawId)
      : ((await source.getChapters(rawId)).at(-1) ?? null);
    return chapter ? prefixChapter(source.info.id, chapter) : null;
  }

  async getReader(chapterId: string): Promise<ReaderContent> {
    const { sourceId, rawId } = parseSourceId(chapterId);
    const source = await this.resolve(sourceId);
    return source.getReader(rawId);
  }

  async reportPage(url: string, success: boolean, bytes: number, duration: number): Promise<void> {
    const mangadex = this.registry.get('mangadex');
    if (mangadex?.reportPage) {
      await mangadex.reportPage(url, success, bytes, duration);
    }
  }

  private async resolve(sourceId: string) {
    await this.registry.ready();
    return this.registry.get(sourceId) ?? this.registry.getActive('manga');
  }
}
