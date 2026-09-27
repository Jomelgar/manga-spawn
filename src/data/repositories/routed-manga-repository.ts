import { Manga, MangaSearchFilters, MangaTag, Page } from '@/domain/models/manga';
import { MangaRepository } from '@/domain/repositories/manga-repository';
import { parseSourceId, withSource } from '@/domain/source-id';

import { SourceRegistry } from '@/core/di/source-registry';

function prefixManga(sourceId: string, manga: Manga): Manga {
  return { ...manga, id: withSource(sourceId, manga.id) };
}

export class RoutedMangaRepository implements MangaRepository {
  constructor(private readonly registry: SourceRegistry) {}

  async search(
    filters: MangaSearchFilters,
    offset: number,
    limit: number,
  ): Promise<Page<Manga>> {
    const source = await this.active();
    return this.prefixPage(source.info.id, await source.search(filters, offset, limit));
  }

  async getById(id: string): Promise<Manga> {
    const { sourceId, rawId } = parseSourceId(id);
    const source = await this.resolve(sourceId);
    return prefixManga(source.info.id, await source.getManga(rawId));
  }

  async getTags(): Promise<MangaTag[]> {
    return (await this.active()).getTags();
  }

  async getPopular(offset: number, limit: number): Promise<Page<Manga>> {
    const source = await this.active();
    return this.prefixPage(source.info.id, await source.getPopular(offset, limit));
  }

  async getLatest(offset: number, limit: number): Promise<Page<Manga>> {
    const source = await this.active();
    return this.prefixPage(source.info.id, await source.getLatest(offset, limit));
  }

  private async active() {
    await this.registry.ready();
    return this.registry.getActive();
  }

  private async resolve(sourceId: string) {
    await this.registry.ready();
    return this.registry.get(sourceId) ?? this.registry.getActive();
  }

  private prefixPage(sourceId: string, page: Page<Manga>): Page<Manga> {
    return { ...page, items: page.items.map((manga) => prefixManga(sourceId, manga)) };
  }
}
