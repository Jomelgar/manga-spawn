import type { ContentSearchFilters } from '../../models';
import type { HttpClient, QueryValue } from '../../http';

import type { AtHomeDto, ChapterDto, MangaDexResponse, MangaDto, TagDto } from './dto';

const RELATIONS = ['cover_art', 'author', 'artist'];

export class MangaDexMangaDatasource {
  constructor(private readonly http: HttpClient) {}

  search(
    filters: ContentSearchFilters,
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
      params: { 'includes[]': RELATIONS },
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

export class MangaDexChapterDatasource {
  constructor(private readonly http: HttpClient) {}

  feed(
    mangaId: string,
    languages: string[],
    order: 'asc' | 'desc',
    limit: number,
  ): Promise<MangaDexResponse<ChapterDto[]>> {
    const params: Record<string, QueryValue> = {
      'includes[]': ['scanlation_group'],
      'translatedLanguage[]': languages,
      'order[chapter]': order,
      limit,
      contentRating: undefined,
    };
    return this.http.get<MangaDexResponse<ChapterDto[]>>(`/manga/${mangaId}/feed`, { params });
  }

  getById(id: string): Promise<MangaDexResponse<ChapterDto>> {
    return this.http.get<MangaDexResponse<ChapterDto>>(`/chapter/${id}`, {
      params: { 'includes[]': ['manga', 'scanlation_group'] },
    });
  }

  getAtHome(chapterId: string): Promise<AtHomeDto> {
    return this.http.get<AtHomeDto>(`/at-home/server/${chapterId}`);
  }

  async report(
    reportUrl: string,
    url: string,
    success: boolean,
    bytes: number,
    duration: number,
  ): Promise<void> {
    if (url.includes('mangadex.org')) return;
    try {
      await this.http.postJson(reportUrl, {
        url,
        success,
        bytes,
        duration,
        cached: false,
      });
    } catch {
      return;
    }
  }
}

export function buildMangaParams(
  filters: ContentSearchFilters,
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
