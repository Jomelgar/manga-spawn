import type { InfiniteData } from '@tanstack/react-query';

import type { Page } from '@/domain/models/manga';

export function flattenPages<T>(data: InfiniteData<Page<T>> | undefined): T[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}
