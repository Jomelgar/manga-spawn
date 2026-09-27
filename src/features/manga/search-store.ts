import { useSyncExternalStore } from 'react';

export interface SearchQuery {
  title?: string;
  includedTags?: string[];
}

export interface SearchState {
  title: string;
  selectedTags: string[];
  query: SearchQuery | null;
}

const initialState: SearchState = {
  title: '',
  selectedTags: [],
  query: null,
};

let state: SearchState = initialState;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export const searchStore = {
  get: (): SearchState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setTitle: (title: string): void => {
    state = { ...state, title };
    emit();
  },
  toggleTag: (id: string): void => {
    const selectedTags = state.selectedTags.includes(id)
      ? state.selectedTags.filter((tag) => tag !== id)
      : [...state.selectedTags, id];
    state = { ...state, selectedTags };
    emit();
  },
  submit: (): void => {
    const title = state.title.trim();
    state = {
      ...state,
      query: {
        title: title || undefined,
        includedTags: state.selectedTags.length ? state.selectedTags : undefined,
      },
    };
    emit();
  },
  clear: (): void => {
    state = initialState;
    emit();
  },
};

export function useSearchState(): SearchState {
  return useSyncExternalStore(searchStore.subscribe, searchStore.get, searchStore.get);
}
