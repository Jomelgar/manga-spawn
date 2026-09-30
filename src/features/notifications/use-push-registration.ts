import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';
import { toServerSubscriptions } from '@/domain/services/server-subscriptions';

export const pushRegistrationKeys = {
  enabled: ['push-registration', 'enabled'] as const,
  deviceId: ['push-registration', 'device-id'] as const,
};

export function usePushRegistrationEnabled(): boolean {
  const { pushRegistration } = useRepositories();
  return pushRegistration.isEnabled();
}

export function useDeviceId() {
  const { pushRegistration } = useRepositories();
  return useQuery({
    queryKey: pushRegistrationKeys.deviceId,
    queryFn: () => pushRegistration.getDeviceId(),
    enabled: pushRegistration.isEnabled(),
  });
}

export function useSyncPushRegistration() {
  const { pushRegistration, library } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const followed = await library.listFollowed();
      await pushRegistration.syncSubscriptions(toServerSubscriptions(followed));
      return followed.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushRegistrationKeys.deviceId });
    },
  });
}

export function useUnregisterPush() {
  const { pushRegistration } = useRepositories();
  return useMutation({ mutationFn: () => pushRegistration.unregister() });
}
