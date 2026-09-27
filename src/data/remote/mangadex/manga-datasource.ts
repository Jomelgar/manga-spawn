import { MangaSearchFilters } from '@/domain/models/manga';

import { MangaDexResponse, MangaDto, TagDto } from './dto';
import { HttpClient, QueryValue } from './http-client';

const RELATIONS = ['cover_art', 'author', 'artist'];

export class MangaDexMangaDatasource {
  constructor(private readonly http: HttpClient) {}

  search(
    filters: MangaSearchFilters,
    offset: number,
    limit: number,
    languages: string[],
  ): Promise<MangaDexResponse<MangaDto[]>> {
    return this.http.get<MangaDexResponse<MangaDto[]>>('/manga', {
      params: {
        ...buildMangaParams(filters, languages),
        offset,
        limit,
      },
    });
  }

  getById(id: string): Promise<MangaDexResponse<MangaDto>> {
    return this.http.get<MangaDexResponse<MangaDto>>(`/manga/${id}`, {
      params: {
        'includes[]': RELATIONS,
      },
    });
  }

  getTags(): Promise<MangaDexResponse<TagDto[]>> {
    return this.http.get<MangaDexResponse<TagDto[]>>('/manga/tag');
  }

  getPopular(
    offset: number,
    limit: number,
    languages: string[],
  ): Promise<MangaDexResponse<MangaDto[]>> {
    return this.search(
      { order: { followedCount: 'desc' }, contentRating: ['safe', 'suggestive'] },
      offset,
      limit,
      languages,
    );
  }

  getLatest(
    offset: number,
    limit: number,
    languages: string[],
  ): Promise<MangaDexResponse<MangaDto[]>> {
    return this.search(
      { order: { latestUploadedChapter: 'desc' }, contentRating: ['safe', 'suggestive'] },
      offset,
      limit,
      languages,
    );
  }
}

export function buildMangaParams(
  filters: MangaSearchFilters,
  languages: string[],
): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {
    'includes[]': RELATIONS,
  };

  if (languages.length > 0) {
    params['availableTranslatedLanguage[]'] = languages;
  }

  if (filters.title) params.title = filters.title;
  if (filters.includedTags?.length) params['includedTags[]'] = filters.includedTags;
  if (filters.excludedTags?.length) params['excludedTags[]'] = filters.excludedTags;
  if (filters.status?.length) params['status[]'] = filters.status;
  if (filters.contentRating?.length) params['contentRating[]'] = filters.contentRating;
  if (filters.publicationDemographic?.length) {
    params['publicationDemographic[]'] = filters.publicationDemographic;
  }

  if (filters.order) {
    for (const [key, direction] of Object.entries(filters.order)) {
      if (direction) params[`order[${key}]`] = direction;
    }
  }

  return params;
}
