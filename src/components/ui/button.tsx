import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const palette: Record<Variant, { background: string; text: string }> = {
    primary: { background: theme.accent, text: theme.accentText },
    secondary: { background: theme.backgroundElement, text: theme.text },
    ghost: { background: 'transparent', text: theme.accent },
    danger: { background: theme.danger, text: '#ffffff' },
  };
  const colors = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colors.background, opacity: pressed || disabled ? 0.7 : 1 },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <ThemedText type="smallBold" style={{ color: colors.text }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  ghost: {
    minHeight: 40,
    paddingHorizontal: Spacing.two,
  },
});
