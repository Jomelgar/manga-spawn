import {
  listDevicesForManga,
  listSubscriptionGroups,
  updateGroupRelease,
} from '../db/repository';
import { sendPush } from '../services/expo-push';
import { registry } from '../sources';

export async function checkForNewChapters(): Promise<void> {
  const groups = listSubscriptionGroups();

  for (const group of groups) {
    const source = registry.get(group.source_id);
    if (!source?.getLatestRelease) continue;

    try {
      const latest = await source.getLatestRelease(group.raw_id);
      if (!latest) continue;

      const isNew = Boolean(group.last_known_release_id) && latest.id !== group.last_known_release_id;
      if (!isNew) continue;

      const devices = listDevicesForManga(group.manga_id);
      const chapterLabel = latest.chapter ? ` cap. ${latest.chapter}` : '';
      const releaseId = `${group.source_id}:${latest.id}`;

      await sendPush(
        devices.map((device) => ({ deviceId: device.id, token: device.expo_token })),
        {
          title: 'Nuevo contenido disponible',
          body: `«${group.title}»${chapterLabel} ya está disponible.`,
          data: {
            url: `/chapter/${releaseId}?mangaId=${encodeURIComponent(group.manga_id)}`,
          },
        },
      );

      updateGroupRelease(group.source_id, group.raw_id, latest.id);
    } catch (error) {
      console.error(`[checker] ${group.source_id}:${group.raw_id}`, error);
    }
  }
}
