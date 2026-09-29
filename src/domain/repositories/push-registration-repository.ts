import { ServerSubscription } from '../models/device';

export interface PushRegistrationRepository {
  isEnabled(): boolean;
  getDeviceId(): Promise<string>;
  syncSubscriptions(items: ServerSubscription[]): Promise<void>;
  sync(): Promise<void>;
  unregister(): Promise<void>;
}
