import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ChapterRow } from '@/components/chapter-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { TagChip } from '@/components/tag-chip';
import { Spacing } from '@/constants/theme';
import {
  useChapterFeed,
  useMangaDetail,
} from '@/features/manga/use-manga';
import {
  useIsFollowed,
  useMangaProgress,
  useToggleFollow,
} from '@/features/library/use-library';
import { useTheme } from '@/hooks/use-theme';

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const { data: manga, isLoading, isError } = useMangaDetail(id);
  const { data: chapters } = useChapterFeed(id);
  const { data: followed } = useIsFollowed(id);
  const { data: progress } = useMangaProgress(id);
  const toggleFollow = useToggleFollow();

  if (isLoading) {
    return (
      <Screen edges={['left', 'right']}>
        <Loading />
      </Screen>
    );
  }

  if (isError || !manga) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState title="No se pudo cargar" message="Intenta nuevamente más tarde." />
      </Screen>
    );
  }

  const readIndex = progress
    ? (chapters ?? []).findIndex((chapter) => chapter.id === progress.chapterId)
    : -1;

  const header = (
    <View style={styles.header}>
      <View style={styles.top}>
        {manga.coverUrl ? (
          <Image
            source={{ uri: manga.coverUrl, headers: manga.coverHeaders }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cover, { backgroundColor: theme.backgroundElement }]} />
        )}
        <View style={styles.meta}>
          <ThemedText type="smallBold" numberOfLines={3}>
            {manga.title}
          </ThemedText>
          {manga.authors.length ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {manga.authors.join(', ')}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            {manga.status}
            {manga.year ? ` · ${manga.year}` : ''} · {manga.contentRating}
          </ThemedText>
          <Button
            title={followed ? 'Siguiendo' : 'Seguir'}
            variant={followed ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            onPress={() => toggleFollow.mutate({ followed: Boolean(followed), manga })}
          />
        </View>
      </View>

      {manga.tags.length ? (
        <View style={styles.tags}>
          {manga.tags.slice(0, 8).map((tag) => (
            <TagChip key={tag.id} label={tag.name} />
          ))}
        </View>
      ) : null}

      {manga.description ? (
        <ThemedText type="small" themeColor="textSecondary">
          {manga.description}
        </ThemedText>
      ) : null}

      <ThemedText type="smallBold">Capítulos</ThemedText>
    </View>
  );

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: manga.title }} />
      <FlatList
        data={chapters ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<ThemedText type="small">Sin capítulos disponibles.</ThemedText>}
        renderItem={({ item, index }) => (
          <ChapterRow
            chapter={item}
            mangaId={manga.id}
            mangaTitle={manga.title}
            read={readIndex >= 0 && index <= readIndex}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: Spacing.two,
  },
  meta: {
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
});
