import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, type ViewToken } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Spacing } from '@/constants/theme';
import { useRepositories } from '@/core/di/provider';
import { ChapterPage } from '@/domain/models/chapter';
import { buildWeeklyReminderMessage } from '@/domain/services/weekly-reminder-message';
import { useMangaProgress, useSaveProgress } from '@/features/library/use-library';
import {
  useChapterDetail,
  useChapterFeed,
  useChapterPages,
  useMangaDetail,
} from '@/features/manga/use-manga';
import { useTheme } from '@/hooks/use-theme';

const PAGE_RATIO = 1.4;

function ChapterPageImage({ page, width }: { page: ChapterPage; width: number }) {
  const theme = useTheme();
  return (
    <Image
      source={{ uri: page.url, headers: page.headers }}
      style={{ width, height: width * PAGE_RATIO, backgroundColor: theme.backgroundElement }}
      contentFit="contain"
      transition={150}
    />
  );
}

export default function ChapterReaderScreen() {
  const params = useLocalSearchParams<{ id: string; mangaId?: string }>();
  const chapterId = params.id;
  const { width } = useWindowDimensions();
  const { notifications } = useRepositories();

  const { data: chapter, isLoading: loadingChapter } = useChapterDetail(chapterId);
  const mangaId = params.mangaId ?? chapter?.mangaId ?? '';
  const { data: manga } = useMangaDetail(mangaId);
  const { data: chapters } = useChapterFeed(mangaId);
  const { data: pages, isLoading, isError } = useChapterPages(chapterId);
  const { data: savedProgress, isLoading: loadingProgress } = useMangaProgress(mangaId);
  const saveProgress = useSaveProgress();

  const [currentPage, setCurrentPage] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (page: number) => {
      if (!mangaId || !chapterId) return;
      const progress = {
        mangaId,
        mangaTitle: manga?.title ?? 'Manga',
        coverUrl: manga?.coverUrl ?? null,
        chapterId,
        chapterNumber: chapter?.chapter ?? null,
        page,
        updatedAt: new Date().toISOString(),
      };
      saveProgress.mutate(progress, {
        onSuccess: () => {
          const message = buildWeeklyReminderMessage(progress);
          notifications
            .syncWeeklyReminder(message.title, message.body, message.url)
            .catch(() => undefined);
        },
      });
    },
    [mangaId, chapterId, manga, chapter, saveProgress, notifications],
  );

  useEffect(() => {
    if (!mangaId || !chapterId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(currentPage), 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [currentPage, mangaId, chapterId, persist]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((token) => token.isViewable);
      if (first?.index != null) setCurrentPage(first.index);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChapterPage }) => <ChapterPageImage page={item} width={width} />,
    [width],
  );

  const { previousChapter, nextChapter } = useMemo(() => {
    if (!chapters) return { previousChapter: undefined, nextChapter: undefined };
    const index = chapters.findIndex((item) => item.id === chapterId);
    if (index < 0) return { previousChapter: undefined, nextChapter: undefined };
    return {
      previousChapter: index > 0 ? chapters[index - 1] : undefined,
      nextChapter: index < chapters.length - 1 ? chapters[index + 1] : undefined,
    };
  }, [chapters, chapterId]);

  const openChapter = useCallback(
    (id: string) => {
      router.replace({ pathname: '/chapter/[id]', params: { id, mangaId } });
    },
    [mangaId],
  );

  if (isLoading || loadingChapter || loadingProgress) {
    return (
      <Screen edges={['left', 'right']}>
        <Loading message="Cargando páginas…" />
      </Screen>
    );
  }

  if (isError || !pages) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState title="No se pudo cargar el capítulo" message="Intenta más tarde." />
      </Screen>
    );
  }

  const total = pages.pages.length;
  const initialIndex =
    savedProgress?.chapterId === chapterId ? Math.min(savedProgress.page, total - 1) : 0;
  const chapterLabel = chapter?.chapter ? `Cap. ${chapter.chapter}` : '';

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: manga?.title ?? 'Lector' }} />
      <ThemedView type="backgroundElement" style={styles.statusBar}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.statusTitle}>
          {chapterLabel || manga?.title || 'Leyendo'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {currentPage + 1}/{total}
        </ThemedText>
      </ThemedView>

      <FlatList
        data={pages.pages}
        keyExtractor={(item) => item.fileName}
        renderItem={renderItem}
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({
          length: width * PAGE_RATIO,
          offset: width * PAGE_RATIO * index,
          index,
        })}
        contentContainerStyle={styles.content}
      />

      <ThemedView type="backgroundElement" style={styles.navBar}>
        <Button
          title="Anterior"
          variant="secondary"
          style={styles.navButton}
          disabled={!previousChapter}
          onPress={() => previousChapter && openChapter(previousChapter.id)}
        />
        <Button
          title="Lista"
          variant="ghost"
          style={styles.navButton}
          disabled={!mangaId}
          onPress={() => {
            if (mangaId) router.push({ pathname: '/manga/[id]', params: { id: mangaId } });
          }}
        />
        <Button
          title="Siguiente"
          style={styles.navButton}
          disabled={!nextChapter}
          onPress={() => nextChapter && openChapter(nextChapter.id)}
        />
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  statusTitle: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  navButton: {
    flex: 1,
  },
});
