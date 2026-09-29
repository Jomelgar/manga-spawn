import { SettingsRepository } from '@/domain/repositories/settings-repository';

export function languageProvider(settings: SettingsRepository): () => Promise<string[]> {
  return async () => {
    const language = await settings.getLanguage();
    if (language === 'all') return [];
    return [language === 'es-la' ? 'es' : language];
  };
}
