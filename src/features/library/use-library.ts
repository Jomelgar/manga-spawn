import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { ReadingProgress } from '@/domain/models/reading-progress';

export const libraryKeys = {
  followed: ['library', 'followed'] as const,
  isFollowed: (mangaId: string) => ['library', 'is-followed', mangaId] as const,
  lastRead: ['library', 'last-read'] as const,
  progress: (mangaId: string) => ['library', 'progress', mangaId] as const,
};

export function useFollowedManga() {
  const { library } = useRepositories();
  return useQuery({ queryKey: libraryKeys.followed, queryFn: () => library.listFollowed() });
}

export function useIsFollowed(mangaId: string) {
  const { library } = useRepositories();
  return useQuery({
    queryKey: libraryKeys.isFollowed(mangaId),
    queryFn: () => library.isFollowed(mangaId),
    enabled: Boolean(mangaId),
  });
}

export function useLastRead() {
  const { library } = useRepositories();
  return useQuery({ queryKey: libraryKeys.lastRead, queryFn: () => library.getLastRead() });
}

export function useMangaProgress(mangaId: string) {
  const { library } = useRepositories();
  return useQuery({
    queryKey: libraryKeys.progress(mangaId),
    queryFn: () => library.getProgress(mangaId),
    enabled: Boolean(mangaId),
  });
}

export function useToggleFollow() {
  const { library } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      followed: boolean;
      manga: {
        id: string;
        title: string;
        coverUrl: string | null;
        latestUploadedChapter: string | null;
        lastChapter: string | null;
      };
    }) => {
      if (input.followed) {
        await library.unfollow(input.manga.id);
      } else {
        await library.follow({
          mangaId: input.manga.id,
          title: input.manga.title,
          coverUrl: input.manga.coverUrl,
          lastKnownChapterId: null,
          lastKnownChapterNumber: input.manga.lastChapter,
        });
      }
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.followed });
      queryClient.invalidateQueries({ queryKey: libraryKeys.isFollowed(input.manga.id) });
    },
  });
}

export function useSaveProgress() {
  const { library } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (progress: ReadingProgress) => library.saveProgress(progress),
    onSuccess: (_data, progress) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.lastRead });
      queryClient.invalidateQueries({ queryKey: libraryKeys.progress(progress.mangaId) });
    },
  });
}
