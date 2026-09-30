import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ReadingProgress } from '@/domain/models/reading-progress';
import { useTheme } from '@/hooks/use-theme';

const KIND_LABEL: Record<ReadingProgress['kind'], string> = {
  manga: 'Manga',
  book: 'Libro',
  comic: 'Comic',
};

const TITLE_LINE_HEIGHT = 20;
const TITLE_LINES = 2;

export function ContinueReading({ items }: { items: ReadingProgress[] }) {
  const theme = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Continuar leyendo
      </ThemedText>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.mangaId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/chapter/[id]',
                params: { id: item.chapterId, mangaId: item.mangaId },
              })
            }
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.card}>
              {item.coverUrl ? (
                <Image
                  source={{ uri: item.coverUrl, headers: item.coverHeaders }}
                  style={styles.cover}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[styles.cover, { backgroundColor: theme.backgroundSelected }]}
                />
              )}
              <ThemedText type="smallBold" numberOfLines={TITLE_LINES} style={styles.title}>
                {item.mangaTitle}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {KIND_LABEL[item.kind]}
                {item.chapterNumber ? ` · #${item.chapterNumber}` : ''}
              </ThemedText>
            </ThemedView>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  card: {
    width: 120,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cover: {
    width: '100%',
    height: 120,
    borderRadius: Spacing.one,
  },
  title: {
    marginTop: Spacing.half,
    minHeight: TITLE_LINE_HEIGHT * TITLE_LINES,
  },
  pressed: {
    opacity: 0.7,
  },
});
