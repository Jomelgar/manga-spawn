import {
  ContentSourceRegistry,
  GutenbergSource,
  HttpClient,
  InternetArchiveComicsSource,
  InternetArchiveSource,
  MadaraSource,
  MangaDexSource,
  MegaBananaSource,
  WebtoonsSource,
  WeebCentralSource,
} from '@manga-spawn/content-sources';

export const registry = new ContentSourceRegistry([
  new MangaDexSource(
    new HttpClient('https://api.mangadex.org', { userAgent: 'manga-spawn-server/1.0.0' }),
  ),
  new WeebCentralSource(),
  new GutenbergSource(),
  new InternetArchiveSource(),
  new WebtoonsSource(),
  new InternetArchiveComicsSource(),
  new MadaraSource({
    id: 'marmota',
    name: 'Marmota Comics',
    baseUrl: 'https://marmota.me',
    languages: ['es'],
  }),
  new MegaBananaSource(),
]);
