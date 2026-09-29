import type { ContentKind } from '@manga-spawn/content-sources';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { MangaSearchFilters } from '@/domain/models/manga';
import { useActiveSourceId } from '@/features/settings/use-settings';

const PAGE_SIZE = 20;

export const mangaKeys = {
  all: ['manga'] as const,
  popular: (kind: ContentKind, sourceId: string) =>
    [...mangaKeys.all, 'popular', kind, sourceId] as const,
  latest: (kind: ContentKind, sourceId: string) =>
    [...mangaKeys.all, 'latest', kind, sourceId] as const,
  search: (kind: ContentKind, sourceId: string, filters: MangaSearchFilters) =>
    [...mangaKeys.all, 'search', kind, sourceId, filters] as const,
  detail: (id: string) => [...mangaKeys.all, 'detail', id] as const,
  tags: (kind: ContentKind, sourceId: string) =>
    [...mangaKeys.all, 'tags', kind, sourceId] as const,
  feed: (id: string) => [...mangaKeys.all, 'feed', id] as const,
  reader: (id: string) => [...mangaKeys.all, 'reader', id] as const,
  chapter: (id: string) => [...mangaKeys.all, 'chapter', id] as const,
};

export function usePopularManga(kind: ContentKind = 'manga', enabled = true) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId(kind);
  return useInfiniteQuery({
    queryKey: mangaKeys.popular(kind, sourceId ?? 'unknown'),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.getPopular(pageParam, PAGE_SIZE, kind),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useLatestManga(kind: ContentKind = 'manga', enabled = true) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId(kind);
  return useInfiniteQuery({
    queryKey: mangaKeys.latest(kind, sourceId ?? 'unknown'),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.getLatest(pageParam, PAGE_SIZE, kind),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useMangaSearch(
  filters: MangaSearchFilters,
  enabled: boolean,
  kind: ContentKind = 'manga',
) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId(kind);
  return useInfiniteQuery({
    queryKey: mangaKeys.search(kind, sourceId ?? 'unknown', filters),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.search(filters, pageParam, PAGE_SIZE, kind),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useMangaTags(kind: ContentKind = 'manga') {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId(kind);
  return useQuery({
    queryKey: mangaKeys.tags(kind, sourceId ?? 'unknown'),
    queryFn: () => manga.getTags(kind),
    enabled: Boolean(sourceId),
  });
}

export function useMangaDetail(id: string) {
  const { manga } = useRepositories();
  return useQuery({
    queryKey: mangaKeys.detail(id),
    queryFn: () => manga.getById(id),
    enabled: Boolean(id),
  });
}

export function useChapterFeed(mangaId: string) {
  const { chapter } = useRepositories();
  return useQuery({
    queryKey: mangaKeys.feed(mangaId),
    queryFn: () => chapter.getFeed({ mangaId, order: 'asc' }),
    enabled: Boolean(mangaId),
  });
}

export function useChapterReader(chapterId: string) {
  const { chapter } = useRepositories();
  return useQuery({
    queryKey: mangaKeys.reader(chapterId),
    queryFn: () => chapter.getReader(chapterId),
    enabled: Boolean(chapterId),
  });
}

export function useChapterDetail(chapterId: string) {
  const { chapter } = useRepositories();
  return useQuery({
    queryKey: mangaKeys.chapter(chapterId),
    queryFn: () => chapter.getById(chapterId),
    enabled: Boolean(chapterId),
  });
}
