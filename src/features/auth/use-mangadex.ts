import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { MangaDexCredentials } from '@/domain/models/auth';

export const mangadexKeys = {
  connection: ['mangadex', 'connection'] as const,
};

export function useMangadexConnection() {
  const { auth } = useRepositories();
  return useQuery({
    queryKey: mangadexKeys.connection,
    queryFn: () => auth.getMangaDexConnection(),
  });
}

export function useConnectMangadex() {
  const { auth } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: MangaDexCredentials) => auth.connectMangaDex(credentials),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mangadexKeys.connection }),
  });
}

export function useDisconnectMangadex() {
  const { auth } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auth.disconnectMangaDex(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mangadexKeys.connection }),
  });
}
