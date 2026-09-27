import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type ExecutionEnvironment = 'bare' | 'standalone' | 'storeClient';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIos = Platform.OS === 'ios';

export const executionEnvironment = (Constants.executionEnvironment ??
  'bare') as ExecutionEnvironment;

export const isExpoGo = executionEnvironment === 'storeClient';

export const expoGoNotificationsEnabled =
  process.env.EXPO_PUBLIC_EXPO_GO_NOTIFICATIONS === '1';

/**
 * Expo Go on Android crashes when `expo-notifications` is imported (expo/expo#49044),
 * unless the optional patch is applied and the feature flag is enabled.
 */
export function canUseNotifications(): boolean {
  if (isWeb) return false;
  if (isExpoGo && isAndroid && !expoGoNotificationsEnabled) return false;
  return true;
}
