import { LOCALE_FALLBACK } from '@/core/config';
import { Chapter } from '@/domain/models/chapter';
import {
  ContentRating,
  Manga,
  MangaStatus,
  MangaTag,
  PublicationDemographic,
} from '@/domain/models/manga';

import { ChapterDto, LocalizedString, MangaDto, TagDto } from './dto';

function pickLocalized(value: LocalizedString | undefined, preferred = LOCALE_FALLBACK): string {
  if (!value) return '';
  return value[preferred] ?? Object.values(value)[0] ?? '';
}

export function mapTag(dto: TagDto): MangaTag {
  return {
    id: dto.id,
    name: pickLocalized(dto.attributes.name),
    group: dto.attributes.group,
  };
}

export function mapManga(dto: MangaDto): Manga {
  const cover = dto.relationships.find((rel) => rel.type === 'cover_art');
  const fileName = cover?.attributes?.fileName as string | undefined;

  const authors = dto.relationships
    .filter((rel) => rel.type === 'author')
    .map((rel) => (rel.attributes?.name as string) ?? '')
    .filter(Boolean);

  const artists = dto.relationships
    .filter((rel) => rel.type === 'artist')
    .map((rel) => (rel.attributes?.name as string) ?? '')
    .filter(Boolean);

  return {
    id: dto.id,
    title: pickLocalized(dto.attributes.title),
    altTitles: dto.attributes.altTitles.map((entry) => pickLocalized(entry)).filter(Boolean),
    description: pickLocalized(dto.attributes.description),
    status: (dto.attributes.status as MangaStatus) ?? 'unknown',
    year: dto.attributes.year,
    contentRating: dto.attributes.contentRating as ContentRating,
    publicationDemographic:
      (dto.attributes.publicationDemographic as PublicationDemographic) ?? null,
    tags: dto.attributes.tags.map(mapTag),
    authors,
    artists,
    coverUrl: fileName ? buildCoverUrl(dto.id, fileName) : null,
    availableLanguages: dto.attributes.availableTranslatedLanguages ?? [],
    lastChapter: dto.attributes.lastChapter,
    latestUploadedChapter: dto.attributes.latestUploadedChapter,
  };
}

export function buildCoverUrl(mangaId: string, fileName: string, size: 256 | 512 = 512): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${size}.jpg`;
}

export function mapChapter(dto: ChapterDto): Chapter {
  const groups = dto.relationships
    .filter((rel) => rel.type === 'scanlation_group')
    .map((rel) => (rel.attributes?.name as string) ?? '')
    .filter(Boolean);

  const mangaRel = dto.relationships.find((rel) => rel.type === 'manga');

  return {
    id: dto.id,
    mangaId: mangaRel?.id ?? '',
    title: dto.attributes.title,
    chapter: dto.attributes.chapter,
    volume: dto.attributes.volume,
    language: dto.attributes.translatedLanguage,
    pages: dto.attributes.pages,
    publishAt: dto.attributes.publishAt,
    readableAt: dto.attributes.readableAt,
    scanlationGroups: groups,
  };
}
