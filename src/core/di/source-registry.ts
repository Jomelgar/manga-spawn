import { MangaSource } from '@/domain/providers/manga-source';
import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { DEFAULT_SOURCE_ID } from '@/domain/source-id';

export class SourceRegistry {
  private readonly sources: Map<string, MangaSource>;
  private readonly readyPromise: Promise<void>;
  private activeId: string;

  constructor(
    sources: MangaSource[],
    private readonly settings: SettingsRepository,
  ) {
    this.sources = new Map(sources.map((source) => [source.info.id, source]));
    this.activeId = DEFAULT_SOURCE_ID;
    this.readyPromise = settings
      .getActiveSourceId()
      .then((id) => {
        if (this.sources.has(id)) this.activeId = id;
      })
      .catch(() => undefined);
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  list(): MangaSource[] {
    return [...this.sources.values()];
  }

  get(id: string): MangaSource | undefined {
    return this.sources.get(id);
  }

  getActive(): MangaSource {
    const active = this.sources.get(this.activeId);
    if (active) return active;
    const [first] = this.sources.values();
    if (!first) throw new Error('No hay fuentes registradas.');
    return first;
  }

  async setActive(id: string): Promise<void> {
    if (!this.sources.has(id)) throw new Error(`Fuente desconocida: ${id}`);
    this.activeId = id;
    await this.settings.setActiveSourceId(id);
  }
}
