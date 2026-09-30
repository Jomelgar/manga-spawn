import type { InfiniteData } from '@tanstack/react-query';

import type { Page } from '@/domain/models/manga';

export function flattenPages<T>(data: InfiniteData<Page<T>> | undefined): T[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}

export function flattenUniquePages<T extends { id: string }>(
  data: InfiniteData<Page<T>> | undefined,
): T[] {
  if (!data) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const page of data.pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}
