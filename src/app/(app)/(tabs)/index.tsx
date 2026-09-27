import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MangaGrid } from '@/components/manga-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/core/auth/session-provider';
import { flattenPages } from '@/core/utils/pages';
import { useLastRead } from '@/features/library/use-library';
import { useLatestManga, usePopularManga } from '@/features/manga/use-manga';
import { useTheme } from '@/hooks/use-theme';

type Feed = 'popular' | 'latest';

export default function HomeScreen() {
  const { session } = useSession();
  const theme = useTheme();
  const [feed, setFeed] = useState<Feed>('popular');
  const { data: lastRead } = useLastRead();
  const popular = usePopularManga(feed === 'popular');
  const latest = useLatestManga(feed === 'latest');

  const active = feed === 'popular' ? popular : latest;
  const manga = useMemo(() => flattenPages(active.data), [active.data]);

  const header = (
    <View style={styles.header}>
      <View>
        <ThemedText type="subtitle">Hola, {session?.username}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Qué leerás hoy?
        </ThemedText>
      </View>

      {lastRead ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/chapter/[id]',
              params: { id: lastRead.chapterId, mangaId: lastRead.mangaId },
            })
          }>
          <ThemedView type="backgroundElement" style={styles.continueCard}>
            {lastRead.coverUrl ? (
              <Image source={{ uri: lastRead.coverUrl }} style={styles.continueCover} />
            ) : (
              <View style={[styles.continueCover, { backgroundColor: theme.backgroundSelected }]} />
            )}
            <View style={styles.continueInfo}>
              <ThemedText type="small" themeColor="textSecondary">
                Continuar leyendo
              </ThemedText>
              <ThemedText type="smallBold" numberOfLines={1}>
                {lastRead.mangaTitle}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {lastRead.chapterNumber ? `Cap. ${lastRead.chapterNumber} · ` : ''}
                página {lastRead.page + 1}
              </ThemedText>
            </View>
            <Button title="Seguir" variant="ghost" />
          </ThemedView>
        </Pressable>
      ) : null}

      <Segmented
        value={feed}
        onChange={setFeed}
        options={[
          { value: 'popular', label: 'Populares' },
          { value: 'latest', label: 'Recientes' },
        ]}
      />
    </View>
  );

  if (!active.data && active.isFetching) {
    return (
      <Screen>
        <Loading message="Cargando mangas…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <MangaGrid
        data={manga}
        header={header}
        refreshing={active.isRefetching}
        onRefresh={() => active.refetch()}
        onEndReached={() => {
          if (active.hasNextPage && !active.isFetchingNextPage) active.fetchNextPage();
        }}
        footer={
          active.isFetchingNextPage ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
              Cargando más…
            </ThemedText>
          ) : null
        }
        contentPaddingBottom={Spacing.six}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.four,
    paddingBottom: Spacing.two,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  continueCover: {
    width: 44,
    height: 62,
    borderRadius: Spacing.one,
  },
  continueInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
