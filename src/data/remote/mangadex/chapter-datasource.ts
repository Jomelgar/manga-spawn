import { MANGADEX_REPORT_URL } from '@/core/config';

import { AtHomeDto, ChapterDto, MangaDexResponse } from './dto';
import { HttpClient, QueryValue } from './http-client';

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
    url: string,
    success: boolean,
    bytes: number,
    duration: number,
  ): Promise<void> {
    if (url.includes('mangadex.org')) return;
    try {
      await this.http.postJson(MANGADEX_REPORT_URL, {
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
