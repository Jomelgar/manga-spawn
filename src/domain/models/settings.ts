export type LanguagePreference = 'es' | 'es-la' | 'en' | 'all';

export const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'es-la', label: 'Español LatAm' },
  { value: 'en', label: 'Inglés' },
  { value: 'all', label: 'Todos' },
];

export const DEFAULT_LANGUAGE: LanguagePreference = 'es';

export type { ContentInfo as SourceInfo, ContentKind, ReaderKind } from '@manga-spawn/content-sources';
