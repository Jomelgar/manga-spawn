import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ContentKind } from '@manga-spawn/content-sources';

import { ContinueReading } from '@/components/continue-reading';
import { LogoMark } from '@/components/logo';
import { MangaGrid } from '@/components/manga-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Loading } from '@/components/ui/loading';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/core/auth/session-provider';
import { flattenPages } from '@/core/utils/pages';
import { useInProgress } from '@/features/library/use-library';
import { useLatestManga, usePopularManga } from '@/features/manga/use-manga';

type Feed = 'popular' | 'latest';

const KIND_OPTIONS: { value: ContentKind; label: string }[] = [
  { value: 'manga', label: 'Mangas' },
  { value: 'book', label: 'Libros' },
  { value: 'comic', label: 'Comics' },
];

export default function HomeScreen() {
  const { session } = useSession();
  const [feed, setFeed] = useState<Feed>('popular');
  const [kind, setKind] = useState<ContentKind>('manga');
  const { data: inProgress } = useInProgress();
  const popular = usePopularManga(kind, feed === 'popular');
  const latest = useLatestManga(kind, feed === 'latest');

  const active = feed === 'popular' ? popular : latest;
  const manga = useMemo(() => flattenPages(active.data), [active.data]);

  const header = (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <LogoMark size={40} />
        <View style={styles.greetingText}>
          <ThemedText type="subtitle">Hola, {session?.username}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ¿Qué leerás hoy?
          </ThemedText>
        </View>
      </View>

      <ContinueReading items={inProgress ?? []} />

      <Segmented value={kind} onChange={setKind} options={KIND_OPTIONS} />

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
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  greetingText: {
    flex: 1,
    gap: Spacing.half,
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
