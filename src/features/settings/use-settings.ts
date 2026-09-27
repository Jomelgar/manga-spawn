import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { LanguagePreference, SourceInfo } from '@/domain/models/settings';

export const settingsKeys = {
  language: ['settings', 'language'] as const,
  activeSource: ['settings', 'active-source'] as const,
  sources: ['settings', 'sources'] as const,
};

export function useLanguage() {
  const { settings } = useRepositories();
  return useQuery({
    queryKey: settingsKeys.language,
    queryFn: () => settings.getLanguage(),
  });
}

export function useUpdateLanguage() {
  const { settings } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: LanguagePreference) => settings.setLanguage(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.language });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });
}

export function useActiveSourceId(): string | undefined {
  const { sources } = useRepositories();
  const query = useQuery({
    queryKey: settingsKeys.activeSource,
    queryFn: async () => {
      await sources.ready();
      return sources.getActive().info.id;
    },
  });
  return query.data;
}

export function useSources(): SourceInfo[] {
  const { sources } = useRepositories();
  const query = useQuery({
    queryKey: settingsKeys.sources,
    queryFn: async () => {
      await sources.ready();
      return sources.list().map((source) => source.info);
    },
  });
  return query.data ?? [];
}

export function useUpdateActiveSource() {
  const { sources } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => sources.setActive(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.activeSource });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });
}
