import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { MangaSearchFilters } from '@/domain/models/manga';
import { useActiveSourceId } from '@/features/settings/use-settings';

const PAGE_SIZE = 20;

export const mangaKeys = {
  all: ['manga'] as const,
  popular: (sourceId: string) => [...mangaKeys.all, 'popular', sourceId] as const,
  latest: (sourceId: string) => [...mangaKeys.all, 'latest', sourceId] as const,
  search: (sourceId: string, filters: MangaSearchFilters) =>
    [...mangaKeys.all, 'search', sourceId, filters] as const,
  detail: (id: string) => [...mangaKeys.all, 'detail', id] as const,
  tags: (sourceId: string) => [...mangaKeys.all, 'tags', sourceId] as const,
  feed: (id: string) => [...mangaKeys.all, 'feed', id] as const,
  pages: (id: string) => [...mangaKeys.all, 'pages', id] as const,
  chapter: (id: string) => [...mangaKeys.all, 'chapter', id] as const,
};

export function usePopularManga(enabled = true) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId();
  return useInfiniteQuery({
    queryKey: mangaKeys.popular(sourceId ?? 'unknown'),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.getPopular(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useLatestManga(enabled = true) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId();
  return useInfiniteQuery({
    queryKey: mangaKeys.latest(sourceId ?? 'unknown'),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.getLatest(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useMangaSearch(filters: MangaSearchFilters, enabled: boolean) {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId();
  return useInfiniteQuery({
    queryKey: mangaKeys.search(sourceId ?? 'unknown', filters),
    enabled: enabled && Boolean(sourceId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => manga.search(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
  });
}

export function useMangaTags() {
  const { manga } = useRepositories();
  const sourceId = useActiveSourceId();
  return useQuery({
    queryKey: mangaKeys.tags(sourceId ?? 'unknown'),
    queryFn: () => manga.getTags(),
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

export function useChapterPages(chapterId: string) {
  const { chapter } = useRepositories();
  return useQuery({
    queryKey: mangaKeys.pages(chapterId),
    queryFn: () => chapter.getPages(chapterId),
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
