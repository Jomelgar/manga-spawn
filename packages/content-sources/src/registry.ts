import type { ContentSource } from './content-source';
import type { ContentKind } from './models';

export class ContentSourceRegistry {
  private readonly sources: Map<string, ContentSource>;

  constructor(sources: ContentSource[]) {
    this.sources = new Map(sources.map((source) => [source.info.id, source]));
  }

  list(): ContentSource[] {
    return [...this.sources.values()];
  }

  listByKind(kind: ContentKind): ContentSource[] {
    return this.list().filter((source) => source.info.kind === kind);
  }

  get(id: string): ContentSource | undefined {
    return this.sources.get(id);
  }

  require(id: string): ContentSource {
    const source = this.sources.get(id);
    if (!source) throw new Error(`Fuente desconocida: ${id}`);
    return source;
  }
}
