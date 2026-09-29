import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { ContentKind, LanguagePreference, SourceInfo } from '@/domain/models/settings';

export const settingsKeys = {
  language: ['settings', 'language'] as const,
  activeSource: (kind: ContentKind) => ['settings', 'active-source', kind] as const,
  sources: (kind?: ContentKind) => ['settings', 'sources', kind ?? 'all'] as const,
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

export function useActiveSourceId(kind: ContentKind = 'manga'): string | undefined {
  const { sources } = useRepositories();
  const query = useQuery({
    queryKey: settingsKeys.activeSource(kind),
    queryFn: async () => {
      await sources.ready();
      return sources.getActive(kind).info.id;
    },
  });
  return query.data;
}

export function useSources(kind?: ContentKind): SourceInfo[] {
  const { sources } = useRepositories();
  const query = useQuery({
    queryKey: settingsKeys.sources(kind),
    queryFn: async () => {
      await sources.ready();
      const list = kind ? sources.listByKind(kind) : sources.list();
      return list.map((source) => source.info);
    },
  });
  return query.data ?? [];
}

export function useUpdateActiveSource(kind: ContentKind = 'manga') {
  const { sources } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => sources.setActive(kind, sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.activeSource(kind) });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });
}
