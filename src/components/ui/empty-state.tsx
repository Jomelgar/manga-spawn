import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  title: {
    textAlign: 'center',
  },
});
