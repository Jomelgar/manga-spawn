import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';

import { ZoomableImage } from '@/components/zoomable-image';
import { ChapterPage } from '@/domain/models/chapter';
import { ReaderMode } from '@/domain/models/reader';

const PAGE_RATIO = 1.4;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

interface ImageReaderProps {
  pages: ChapterPage[];
  initialIndex: number;
  mode: ReaderMode;
  onPageChange: (index: number) => void;
}

export function ImageReader({ pages, initialIndex, mode, onPageChange }: ImageReaderProps) {
  const { width } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(width * PAGE_RATIO);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const isPaged = mode === 'paged';

  const handleZoom = useCallback((zoomed: boolean) => setScrollEnabled(!zoomed), []);

  const renderItem = useCallback(
    ({ item }: { item: ChapterPage }) => (
      <ZoomableImage
        uri={item.url}
        headers={item.headers}
        width={width}
        height={isPaged ? viewportHeight : width * PAGE_RATIO}
        onZoomChange={handleZoom}
      />
    ),
    [width, viewportHeight, isPaged, handleZoom],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isPaged) return;
      const first = viewableItems.find((token) => token.isViewable);
      if (first?.index != null) onPageChange(first.index);
    },
    [isPaged, onPageChange],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isPaged) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      onPageChange(Math.max(0, Math.min(index, pages.length - 1)));
    },
    [isPaged, width, pages.length, onPageChange],
  );

  return (
    <View
      style={styles.container}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
      <FlatList
        key={mode}
        data={pages}
        keyExtractor={(item) => item.fileName}
        renderItem={renderItem}
        initialScrollIndex={initialIndex}
        scrollEnabled={scrollEnabled}
        horizontal={isPaged}
        pagingEnabled={isPaged}
        decelerationRate={isPaged ? 'fast' : 'normal'}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_, index) => {
          const length = isPaged ? width : width * PAGE_RATIO;
          return { length, offset: length * index, index };
        }}
        contentContainerStyle={isPaged ? undefined : styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
});
