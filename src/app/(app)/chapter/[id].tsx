import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, type ViewToken } from 'react-native';

import { BookReader } from '@/components/book-reader';
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
  useChapterReader,
  useMangaDetail,
} from '@/features/manga/use-manga';
import { useReaderSettings } from '@/features/reader/use-reader-settings';
import { ZoomableImage } from '@/components/zoomable-image';

const PAGE_RATIO = 1.4;

export default function ChapterReaderScreen() {
  const params = useLocalSearchParams<{ id: string; mangaId?: string }>();
  const chapterId = params.id;
  const { width } = useWindowDimensions();
  const { notifications } = useRepositories();
  const { settings: readerSettings, update: updateReaderSettings } = useReaderSettings();

  const { data: chapter, isLoading: loadingChapter } = useChapterDetail(chapterId);
  const mangaId = params.mangaId ?? chapter?.mangaId ?? '';
  const { data: manga } = useMangaDetail(mangaId);
  const { data: chapters } = useChapterFeed(mangaId);
  const { data: reader, isLoading, isError } = useChapterReader(chapterId);
  const { data: savedProgress, isLoading: loadingProgress } = useMangaProgress(mangaId);
  const saveProgress = useSaveProgress();

  const [currentPage, setCurrentPage] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (page: number) => {
      if (!mangaId || !chapterId) return;
      const progress = {
        mangaId,
        kind: manga?.kind ?? 'manga',
        mangaTitle: manga?.title ?? 'Manga',
        coverUrl: manga?.coverUrl ?? null,
        coverHeaders: manga?.coverHeaders,
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

  const scheduleSave = useCallback(
    (page: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(page), 900);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((token) => token.isViewable);
      if (first?.index != null) {
        setCurrentPage(first.index);
        scheduleSave(first.index);
      }
    },
    [scheduleSave],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChapterPage }) => (
      <ZoomableImage
        uri={item.url}
        headers={item.headers}
        width={width}
        height={width * PAGE_RATIO}
        onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
      />
    ),
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
        <Loading message="Cargando contenido…" />
      </Screen>
    );
  }

  if (isError || !reader) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState title="No se pudo cargar el contenido" message="Intenta más tarde." />
      </Screen>
    );
  }

  const initialIndex = savedProgress?.chapterId === chapterId ? savedProgress.page : 0;
  const chapterLabel = chapter?.chapter ? `Cap. ${chapter.chapter}` : '';

  if (reader.type === 'text' || reader.type === 'html') {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: reader.title ?? manga?.title ?? 'Leyendo' }} />
        <BookReader
          body={reader.body}
          format={reader.type}
          initialParagraph={initialIndex}
          onProgress={scheduleSave}
          settings={readerSettings}
          onSettingsChange={updateReaderSettings}
        />
      </Screen>
    );
  }

  const pages = reader.pages;
  const total = pages.length;
  const imageInitialIndex = Math.min(initialIndex, Math.max(0, total - 1));

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
        data={pages}
        keyExtractor={(item) => item.fileName}
        renderItem={renderItem}
        initialScrollIndex={imageInitialIndex}
        scrollEnabled={scrollEnabled}
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
