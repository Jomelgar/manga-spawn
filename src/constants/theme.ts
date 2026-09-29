/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#13251A',
    background: '#F4F8F0',
    backgroundElement: '#E4EEDD',
    backgroundSelected: '#CFE0C4',
    textSecondary: '#5A6B57',
    accent: '#3F7A45',
    accentText: '#F4F8F0',
    border: '#C6D6BC',
    danger: '#C0392B',
    success: '#2E7D32',
  },
  dark: {
    text: '#EAF3E4',
    background: '#0E1A12',
    backgroundElement: '#1A2A1E',
    backgroundSelected: '#263A29',
    textSecondary: '#9DB39A',
    accent: '#7BC47F',
    accentText: '#0E1A12',
    border: '#2E4433',
    danger: '#FF6B6B',
    success: '#7BC47F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
