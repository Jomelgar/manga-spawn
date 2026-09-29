import type {
  Content,
  ContentInfo,
  ContentSearchFilters,
  ContentTag,
  Page,
  ReaderContent,
  Release,
} from './models';

export interface ContentSource {
  readonly info: ContentInfo;

  search(filters: ContentSearchFilters, offset: number, limit: number): Promise<Page<Content>>;
  getContent(rawId: string): Promise<Content>;
  getTags(): Promise<ContentTag[]>;
  getPopular(offset: number, limit: number): Promise<Page<Content>>;
  getLatest(offset: number, limit: number): Promise<Page<Content>>;

  getReleases(rawContentId: string): Promise<Release[]>;
  getRelease(rawReleaseId: string): Promise<Release>;
  getReader(rawReleaseId: string): Promise<ReaderContent>;
  getLatestRelease?(rawContentId: string): Promise<Release | null>;

  reportPage?(url: string, success: boolean, bytes: number, duration: number): Promise<void>;
}
