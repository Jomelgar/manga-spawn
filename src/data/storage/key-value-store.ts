import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class WebStorage implements KeyValueStore {
  async getItem(key: string): Promise<string | null> {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}

class SecureStorage implements KeyValueStore {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

class AsyncStorageAdapter implements KeyValueStore {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const secureStore: KeyValueStore =
  Platform.OS === 'web' ? new WebStorage() : new SecureStorage();

export const appStore: KeyValueStore =
  Platform.OS === 'web' ? new WebStorage() : new AsyncStorageAdapter();

export async function readJson<T>(store: KeyValueStore, key: string): Promise<T | null> {
  const raw = await store.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(store: KeyValueStore, key: string, value: T): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}
