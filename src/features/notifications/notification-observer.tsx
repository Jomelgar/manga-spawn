import { type Href, router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useSession } from '@/core/auth/session-provider';
import { useRepositories } from '@/core/di/provider';
import { buildWeeklyReminderMessage } from '@/domain/services/weekly-reminder-message';
import { NewChapterChecker } from '@/domain/services/new-chapter-checker';
import { toServerSubscriptions } from '@/domain/services/server-subscriptions';

export function NotificationObserver() {
  const { session } = useSession();
  const repositories = useRepositories();
  const bootstrapped = useRef(false);

  useEffect(() => {
    const { notifications } = repositories;
    if (!notifications.isSupported()) return;

    const redirect = (url: string | null) => {
      if (url) router.push(url as Href);
    };

    notifications.getInitialNotificationUrl().then(redirect).catch(() => undefined);
    const unsubscribe = notifications.subscribeToNotificationResponses(redirect);
    return unsubscribe;
  }, [repositories]);

  useEffect(() => {
    if (!session || bootstrapped.current) return;
    bootstrapped.current = true;

    const { library, notifications, chapter, pushRegistration } = repositories;

    (async () => {
      const progress = await library.getLastRead();
      const message = buildWeeklyReminderMessage(progress);
      await notifications.syncWeeklyReminder(message.title, message.body, message.url);

      const followed = await library.listFollowed();

      if (pushRegistration.isEnabled()) {
        await pushRegistration.syncSubscriptions(toServerSubscriptions(followed));
      } else {
        await new NewChapterChecker(chapter, library, notifications).run();
      }
    })().catch(() => undefined);
  }, [session, repositories]);

  return null;
}
