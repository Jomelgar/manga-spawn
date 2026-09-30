import type { ContentKind } from '@manga-spawn/content-sources';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MangaGrid } from '@/components/manga-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { TagChip } from '@/components/tag-chip';
import { Spacing } from '@/constants/theme';
import { flattenUniquePages } from '@/core/utils/pages';
import { MangaSearchFilters } from '@/domain/models/manga';
import { searchStore, useSearchState } from '@/features/manga/search-store';
import { useMangaSearch, useMangaTags } from '@/features/manga/use-manga';

const KIND_OPTIONS: { value: ContentKind; label: string }[] = [
  { value: 'manga', label: 'Mangas' },
  { value: 'book', label: 'Libros' },
  { value: 'comic', label: 'Comics' },
];

export default function SearchScreen() {
  const { title, selectedTags, query } = useSearchState();
  const [kind, setKind] = useState<ContentKind>('manga');
  const { data: tags } = useMangaTags(kind);

  const filters = useMemo<MangaSearchFilters>(
    () => ({
      title: query?.title,
      includedTags: query?.includedTags,
      order: { relevance: 'desc' },
      contentRating: ['safe', 'suggestive'],
    }),
    [query],
  );

  const enabled = Boolean(query && (query.title || query.includedTags?.length));
  const search = useMangaSearch(filters, enabled, kind);
  const results = useMemo(() => flattenUniquePages(search.data), [search.data]);

  const canSearch = Boolean(title.trim()) || selectedTags.length > 0;

  const header = (
    <View style={styles.header}>
      <ThemedText type="subtitle">Buscar</ThemedText>
      <Segmented value={kind} onChange={setKind} options={KIND_OPTIONS} />
      <TextField
        label="Título"
        placeholder="Ej. One Piece"
        value={title}
        onChangeText={searchStore.setTitle}
        returnKeyType="search"
        onSubmitEditing={() => {
          if (canSearch) searchStore.submit();
        }}
      />
      {tags?.length ? (
        <View style={styles.tags}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Géneros
          </ThemedText>
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                label={tag.name}
                selected={selectedTags.includes(tag.id)}
                onPress={() => searchStore.toggleTag(tag.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button
          title="Buscar"
          style={styles.action}
          disabled={!canSearch}
          onPress={() => searchStore.submit()}
        />
        <Button
          title="Limpiar"
          variant="secondary"
          style={styles.action}
          onPress={() => searchStore.clear()}
        />
      </View>
    </View>
  );

  if (search.isError) {
    return (
      <Screen>
        {header}
        <EmptyState
          title="Error al buscar"
          message={search.error instanceof Error ? search.error.message : 'Intenta de nuevo.'}
        />
      </Screen>
    );
  }

  if (search.isLoading) {
    return (
      <Screen>
        {header}
        <Loading message="Buscando…" />
      </Screen>
    );
  }

  if (enabled && results.length === 0 && !search.isFetching) {
    return (
      <Screen>
        {header}
        <EmptyState title="Sin resultados" message="Prueba con otro título o géneros." />
      </Screen>
    );
  }

  return (
    <Screen>
      <MangaGrid
        data={results}
        header={header}
        refreshing={search.isRefetching}
        onRefresh={() => search.refetch()}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) search.fetchNextPage();
        }}
        contentPaddingBottom={Spacing.six}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  tags: {
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
