import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Chapter } from '@/domain/models/chapter';

interface ChapterRowProps {
  chapter: Chapter;
  mangaId: string;
  mangaTitle: string;
  read?: boolean;
}

export function ChapterRow({ chapter, mangaId, mangaTitle, read = false }: ChapterRowProps) {
  const label = chapter.chapter ? `Capítulo ${chapter.chapter}` : 'Capítulo';
  const group = chapter.scanlationGroups[0];

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/chapter/[id]',
          params: { id: chapter.id, mangaId, title: mangaTitle },
        })
      }
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText type="smallBold" themeColor={read ? 'textSecondary' : 'text'}>
          {label}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {chapter.title || group || chapter.language.toUpperCase()}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {chapter.pages} pág. · {new Date(chapter.readableAt).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
