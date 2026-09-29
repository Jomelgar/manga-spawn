import { ServerSubscription } from '@/domain/models/device';
import { PushRegistrationRepository } from '@/domain/repositories/push-registration-repository';

export class NoopPushRegistrationRepository implements PushRegistrationRepository {
  isEnabled(): boolean {
    return false;
  }

  getDeviceId(): Promise<string> {
    return Promise.resolve('');
  }

  syncSubscriptions(_items: ServerSubscription[]): Promise<void> {
    return Promise.resolve();
  }

  sync(): Promise<void> {
    return Promise.resolve();
  }

  unregister(): Promise<void> {
    return Promise.resolve();
  }
}
