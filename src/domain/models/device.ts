import type { ContentKind } from '@manga-spawn/content-sources';

export interface RegisteredDevice {
  deviceId: string;
  token: string;
  platform: string;
}

export interface ServerSubscription {
  mangaId: string;
  kind: ContentKind;
  title: string;
  coverUrl: string | null;
  lastKnownChapterId: string | null;
}

export interface PendingSync {
  device: RegisteredDevice | null;
  subscriptions: ServerSubscription[];
  dirty: boolean;
  updatedAt: string;
}
