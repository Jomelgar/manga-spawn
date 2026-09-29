import { ContentKind, LanguagePreference } from '../models/settings';

export interface SettingsRepository {
  getLanguage(): Promise<LanguagePreference>;
  setLanguage(language: LanguagePreference): Promise<void>;
  getActiveSourceId(kind: ContentKind): Promise<string>;
  setActiveSourceId(kind: ContentKind, sourceId: string): Promise<void>;
}
