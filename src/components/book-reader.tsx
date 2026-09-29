import { decodeEntities } from '@manga-spawn/content-sources';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  DEFAULT_READER_SETTINGS,
  READER_THEME_COLORS,
  ReaderSettings,
  ReaderTheme,
} from '@/domain/models/reader';

const THEME_ORDER: ReaderTheme[] = ['light', 'sepia', 'dark'];
const THEME_LABEL: Record<ReaderTheme, string> = {
  light: 'Claro',
  sepia: 'Sepia',
  dark: 'Oscuro',
};

interface BookReaderProps {
  body: string;
  format: 'text' | 'html';
  initialParagraph?: number;
  onProgress: (paragraphIndex: number) => void;
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
}

export function BookReader({
  body,
  format,
  initialParagraph = 0,
  onProgress,
  settings,
  onSettingsChange,
}: BookReaderProps) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const [current, setCurrent] = useState(initialParagraph);

  const paragraphs = useMemo(
    () => (format === 'html' ? htmlToParagraphs(body) : textToParagraphs(body)),
    [body, format],
  );

  const colors = READER_THEME_COLORS[settings.theme];

  useEffect(() => {
    if (initialParagraph <= 0 || paragraphs.length === 0) return;
    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: Math.min(initialParagraph, paragraphs.length - 1),
          animated: false,
        });
      } catch {
        return;
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [initialParagraph, paragraphs.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((token) => token.isViewable);
      if (first?.index != null) {
        setCurrent(first.index);
        onProgress(first.index);
      }
    },
    [onProgress],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <ThemedText
        style={{
          color: colors.text,
          fontSize: settings.fontSize,
          lineHeight: settings.fontSize * settings.lineHeight,
          marginBottom: Spacing.three,
        }}>
        {item}
      </ThemedText>
    ),
    [colors.text, settings.fontSize, settings.lineHeight],
  );

  const total = paragraphs.length || 1;
  const percent = Math.min(100, Math.round(((current + 1) / total) * 100));

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView type="backgroundElement" style={styles.toolbar}>
        <ThemedText type="small" themeColor="textSecondary">
          {percent}%
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {current + 1}/{total}
        </ThemedText>
        <Pressable
          onPress={() =>
            onSettingsChange({
              ...settings,
              fontSize: Math.max(13, settings.fontSize - 1),
            })
          }
          hitSlop={8}>
          <ThemedText type="smallBold">A-</ThemedText>
        </Pressable>
        <Pressable
          onPress={() =>
            onSettingsChange({
              ...settings,
              fontSize: Math.min(30, settings.fontSize + 1),
            })
          }
          hitSlop={8}>
          <ThemedText type="smallBold">A+</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            const index = THEME_ORDER.indexOf(settings.theme);
            onSettingsChange({
              ...settings,
              theme: THEME_ORDER[(index + 1) % THEME_ORDER.length],
            });
          }}
          hitSlop={8}>
          <ThemedText type="smallBold">{THEME_LABEL[settings.theme]}</ThemedText>
        </Pressable>
      </ThemedView>

      <FlatList
        ref={listRef}
        data={paragraphs}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          }, 100);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        contentContainerStyle={[styles.content, { width: Math.min(width, 720) }]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

export const DEFAULT_BOOK_SETTINGS = DEFAULT_READER_SETTINGS;

function textToParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function htmlToParagraphs(html: string): string[] {
  const cleaned = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n\n');

  return cleaned
    .replace(/<[^>]+>/g, '')
    .split(/\n{2,}/)
    .map((paragraph) => decodeEntities(paragraph).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
