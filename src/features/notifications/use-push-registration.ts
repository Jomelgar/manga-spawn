import { useMutation, useQuery } from '@tanstack/react-query';

import { useRepositories } from '@/core/di/provider';

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
  const { pushRegistration } = useRepositories();
  return useMutation({ mutationFn: () => pushRegistration.sync() });
}

export function useUnregisterPush() {
  const { pushRegistration } = useRepositories();
  return useMutation({ mutationFn: () => pushRegistration.unregister() });
}
