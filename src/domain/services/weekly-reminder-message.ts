import { ReadingProgress } from '../models/reading-progress';

export interface ReminderMessage {
  title: string;
  body: string;
  url: string;
}

export function buildWeeklyReminderMessage(progress: ReadingProgress | null): ReminderMessage {
  if (!progress) {
    return {
      title: '¿Qué leerás este fin de semana? 📚',
      body: 'Explora mangas nuevos en manga-spawn y retoma tu lectura.',
      url: '/',
    };
  }

  const chapterLabel = progress.chapterNumber
    ? `capítulo ${progress.chapterNumber}`
    : 'el último capítulo';

  return {
    title: 'Continúa tu lectura 📚',
    body: `Te quedaste en «${progress.mangaTitle}» — ${chapterLabel}, página ${progress.page + 1}. ¡Termínalo este finde!`,
    url: `/manga/${progress.mangaId}`,
  };
}
