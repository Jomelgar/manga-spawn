export type ReaderTheme = 'light' | 'sepia' | 'dark';

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  theme: 'light',
};

export const READER_THEME_COLORS: Record<ReaderTheme, { background: string; text: string }> = {
  light: { background: '#FFFFFF', text: '#1A1A1A' },
  sepia: { background: '#F5ECD9', text: '#4A3B2A' },
  dark: { background: '#101418', text: '#D8DEE4' },
};
