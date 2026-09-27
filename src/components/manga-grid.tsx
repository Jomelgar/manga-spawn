import { useCallback, type ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';

import { MangaCard } from '@/components/manga-card';
import { Spacing } from '@/constants/theme';
import { Manga } from '@/domain/models/manga';
import { useTheme } from '@/hooks/use-theme';

const MIN_COLUMN_WIDTH = 130;
const GUTTER = Spacing.three;

interface MangaGridProps {
  data: Manga[];
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactElement | null;
  footer?: ReactElement | null;
  contentPaddingBottom?: number;
}

export function MangaGrid({
  data,
  onEndReached,
  refreshing = false,
  onRefresh,
  header,
  footer,
  contentPaddingBottom = 0,
}: MangaGridProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();

  const columns = Math.max(2, Math.floor((width - GUTTER) / (MIN_COLUMN_WIDTH + GUTTER)));
  const itemWidth = (width - GUTTER * (columns + 1)) / columns;

  const renderItem = useCallback(
    ({ item }: { item: Manga }) => <MangaCard manga={item} width={itemWidth} />,
    [itemWidth],
  );

  return (
    <FlatList
      key={columns}
      data={data}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  row: {
    gap: GUTTER,
  },
});
