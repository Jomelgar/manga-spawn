import { MangaSource } from '@/domain/providers/manga-source';
import { ContentKind } from '@/domain/models/settings';
import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { CONTENT_KINDS, DEFAULT_SOURCE_ID } from '@/domain/source-id';

export class SourceRegistry {
  private readonly sources: Map<string, MangaSource>;
  private readonly readyPromise: Promise<void>;
  private readonly activeByKind: Partial<Record<ContentKind, string>> = {};

  constructor(
    sources: MangaSource[],
    private readonly settings: SettingsRepository,
  ) {
    this.sources = new Map(sources.map((source) => [source.info.id, source]));
    this.readyPromise = this.loadActive();
  }

  private async loadActive(): Promise<void> {
    await Promise.all(
      CONTENT_KINDS.map(async (kind) => {
        const id = await this.settings.getActiveSourceId(kind).catch(() => null);
        if (id && this.sources.has(id)) {
          this.activeByKind[kind] = id;
        }
      }),
    );
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  list(): MangaSource[] {
    return [...this.sources.values()];
  }

  listByKind(kind: ContentKind): MangaSource[] {
    return this.list().filter((source) => source.info.kind === kind);
  }

  get(id: string): MangaSource | undefined {
    return this.sources.get(id);
  }

  getActive(kind: ContentKind = 'manga'): MangaSource {
    const activeId = this.activeByKind[kind];
    const active = activeId ? this.sources.get(activeId) : undefined;
    if (active) return active;

    const [firstOfKind] = this.listByKind(kind);
    if (firstOfKind) return firstOfKind;

    const [fallback] = this.sources.values();
    if (!fallback) throw new Error('No hay fuentes registradas.');
    return fallback;
  }

  async setActive(kind: ContentKind, id: string): Promise<void> {
    if (!this.sources.has(id)) throw new Error(`Fuente desconocida: ${id}`);
    this.activeByKind[kind] = id;
    await this.settings.setActiveSourceId(kind, id);
  }
}

export { DEFAULT_SOURCE_ID };
