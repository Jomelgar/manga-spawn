import { STORAGE_KEYS } from '@/core/config';
import {
  ContentKind,
  DEFAULT_LANGUAGE,
  LanguagePreference,
} from '@/domain/models/settings';
import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { DEFAULT_SOURCE_IDS } from '@/domain/source-id';

import { appStore, KeyValueStore, readJson, writeJson } from '../storage/key-value-store';

type ActiveSources = Partial<Record<ContentKind, string>>;

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

  async getActiveSourceId(kind: ContentKind): Promise<string> {
    const map = (await readJson<ActiveSources>(this.store, STORAGE_KEYS.activeSource)) ?? {};
    return map[kind] ?? DEFAULT_SOURCE_IDS[kind];
  }

  async setActiveSourceId(kind: ContentKind, sourceId: string): Promise<void> {
    const map = (await readJson<ActiveSources>(this.store, STORAGE_KEYS.activeSource)) ?? {};
    await writeJson(this.store, STORAGE_KEYS.activeSource, { ...map, [kind]: sourceId });
  }
}
