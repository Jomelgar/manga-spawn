import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

interface ErrorBoundaryProps {
  error: Error;
  retry: () => Promise<void>;
}

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Algo salió mal</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {error.message}
      </ThemedText>
      <Button title="Reintentar" onPress={() => retry()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  message: {
    textAlign: 'center',
  },
});
