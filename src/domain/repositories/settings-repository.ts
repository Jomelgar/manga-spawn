import { LanguagePreference } from '../models/settings';

export interface SettingsRepository {
  getLanguage(): Promise<LanguagePreference>;
  setLanguage(language: LanguagePreference): Promise<void>;
  getActiveSourceId(): Promise<string>;
  setActiveSourceId(sourceId: string): Promise<void>;
}
