import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/core/config';
import { appStore, readJson, writeJson } from '@/data/storage/key-value-store';
import { DEFAULT_READER_SETTINGS, ReaderSettings } from '@/domain/models/reader';

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);

  useEffect(() => {
    readJson<ReaderSettings>(appStore, STORAGE_KEYS.readerSettings)
      .then((stored) => {
        if (stored) setSettings({ ...DEFAULT_READER_SETTINGS, ...stored });
      })
      .catch(() => undefined);
  }, []);

  const update = useCallback((next: ReaderSettings) => {
    setSettings(next);
    writeJson(appStore, STORAGE_KEYS.readerSettings, next).catch(() => undefined);
  }, []);

  return { settings, update };
}
