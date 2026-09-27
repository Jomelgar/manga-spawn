import { STORAGE_KEYS } from '@/core/config';
import { LanguagePreference, DEFAULT_LANGUAGE } from '@/domain/models/settings';
import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { DEFAULT_SOURCE_ID } from '@/domain/source-id';

import { appStore, KeyValueStore } from '../storage/key-value-store';

export class StorageSettingsRepository implements SettingsRepository {
  constructor(private readonly store: KeyValueStore = appStore) {}

  async getLanguage(): Promise<LanguagePreference> {
    const value = await this.store.getItem(STORAGE_KEYS.language);
    if (value === 'es' || value === 'es-la' || value === 'en' || value === 'all') {
      return value;
    }
    return DEFAULT_LANGUAGE;
  }

  setLanguage(language: LanguagePreference): Promise<void> {
    return this.store.setItem(STORAGE_KEYS.language, language);
  }

  async getActiveSourceId(): Promise<string> {
    return (await this.store.getItem(STORAGE_KEYS.activeSource)) ?? DEFAULT_SOURCE_ID;
  }

  setActiveSourceId(sourceId: string): Promise<void> {
    return this.store.setItem(STORAGE_KEYS.activeSource, sourceId);
  }
}
