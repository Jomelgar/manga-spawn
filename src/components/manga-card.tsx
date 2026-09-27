import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Manga } from '@/domain/models/manga';
import { useTheme } from '@/hooks/use-theme';

const COVER_RATIO = 2 / 3;

export function MangaCard({ manga, width }: { manga: Manga; width: number }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/manga/[id]', params: { id: manga.id } })}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <View
        style={[
          styles.cover,
          { width, height: width / COVER_RATIO, backgroundColor: theme.backgroundElement },
        ]}>
        {manga.coverUrl ? (
          <Image
            source={{ uri: manga.coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
      </View>
      <ThemedText type="small" numberOfLines={2} style={styles.title}>
        {manga.title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  title: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
