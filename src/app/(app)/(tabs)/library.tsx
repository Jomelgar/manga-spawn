import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ContinueReading } from '@/components/continue-reading';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Spacing } from '@/constants/theme';
import { FollowedManga } from '@/domain/models/reading-progress';
import { useFollowedManga, useInProgress } from '@/features/library/use-library';
import { useCheckNewChapters } from '@/features/notifications/use-notifications';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const theme = useTheme();
  const { data, isLoading, refetch, isRefetching } = useFollowedManga();
  const { data: inProgress } = useInProgress();
  const check = useCheckNewChapters();

  const header = (
    <View style={styles.header}>
      <ThemedText type="subtitle">Biblioteca</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Tus títulos seguidos y novedades.
      </ThemedText>
      <ContinueReading items={inProgress ?? []} />
      <Button
        title="Buscar capítulos nuevos"
        variant="secondary"
        loading={check.isPending}
        onPress={() => check.mutate(true)}
      />
      {check.isSuccess ? (
        <ThemedText type="small" themeColor="textSecondary">
          {check.data.alerts.length > 0
            ? `${check.data.alerts.length} manga(s) con capítulos nuevos.`
            : 'No hay capítulos nuevos por ahora.'}
        </ThemedText>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          title="Sin mangas seguidos"
          message="Sigue mangas desde su detalle para verlos aquí."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.mangaId}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => <FollowedRow manga={item} accent={theme.accent} />}
      />
    </Screen>
  );
}

function FollowedRow({ manga, accent }: { manga: FollowedManga; accent: string }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/manga/[id]', params: { id: manga.mangaId } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        {manga.coverUrl ? (
          <Image source={{ uri: manga.coverUrl, headers: manga.coverHeaders }} style={styles.cover} />
        ) : null}
        <View style={styles.info}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {manga.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {manga.lastKnownChapterNumber
              ? `Último capítulo: ${manga.lastKnownChapterNumber}`
              : 'Sin capítulos registrados'}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={{ color: accent }}>
          Ver
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  cover: {
    width: 48,
    height: 68,
    borderRadius: Spacing.one,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
