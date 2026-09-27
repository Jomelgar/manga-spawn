import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { WeeklyReminderConfig } from '@/domain/models/notifications';
import { buildWeeklyReminderMessage } from '@/domain/services/weekly-reminder-message';
import { NewChapterChecker } from '@/domain/services/new-chapter-checker';

export const notificationKeys = {
  weeklyReminder: ['notifications', 'weekly-reminder'] as const,
  permission: ['notifications', 'permission'] as const,
  token: ['notifications', 'token'] as const,
};

export function useNotificationPermission() {
  const { notifications } = useRepositories();
  return useQuery({
    queryKey: notificationKeys.permission,
    queryFn: () => notifications.getPermissionStatus(),
  });
}

export function useRequestNotificationPermission() {
  const { notifications } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.requestPermission(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.permission }),
  });
}

export function useWeeklyReminder() {
  const { notifications } = useRepositories();
  return useQuery({
    queryKey: notificationKeys.weeklyReminder,
    queryFn: () => notifications.getWeeklyReminder(),
  });
}

export function useUpdateWeeklyReminder() {
  const { notifications, library } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: WeeklyReminderConfig) => {
      await notifications.setWeeklyReminder(config);
      if (config.enabled) {
        const progress = await library.getLastRead();
        const message = buildWeeklyReminderMessage(progress);
        await notifications.syncWeeklyReminder(message.title, message.body, message.url);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.weeklyReminder }),
  });
}

export function useStoredPushToken() {
  const { notifications } = useRepositories();
  return useQuery({
    queryKey: notificationKeys.token,
    queryFn: () => notifications.getStoredToken(),
  });
}

export function useRegisterPush() {
  const { notifications } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.registerForPush(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.token }),
  });
}

export function useSendTestPush() {
  const { notifications } = useRepositories();
  return useMutation({
    mutationFn: (token: string) => notifications.sendTestPush(token),
  });
}

export function useScheduleLocalTest() {
  const { notifications } = useRepositories();
  return useMutation({
    mutationFn: () =>
      notifications.scheduleLocalTest(
        'Notificación de prueba',
        'Esta es una notificación local programada por manga-spawn.',
      ),
  });
}

export function useCheckNewChapters() {
  const { chapter, library, notifications } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (force: boolean) =>
      new NewChapterChecker(chapter, library, notifications).run(force),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  });
}
