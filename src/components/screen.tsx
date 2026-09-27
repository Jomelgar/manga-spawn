import type { PropsWithChildren } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';

interface ScreenProps extends PropsWithChildren {
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({ children, style, edges = ['top', 'left', 'right'] }: ScreenProps) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={[styles.flex, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
