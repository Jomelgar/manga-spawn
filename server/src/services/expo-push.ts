import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

import { config } from '../config';
import { insertTicket } from '../db/repository';

export const expo = new Expo(
  config.expoAccessToken ? { accessToken: config.expoAccessToken } : {},
);

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushRecipient {
  deviceId: string;
  token: string;
}

export async function sendPush(
  recipients: PushRecipient[],
  payload: PushPayload,
): Promise<number> {
  const valid = recipients.filter((recipient) => Expo.isExpoPushToken(recipient.token));
  if (valid.length === 0) return 0;

  const messages: ExpoPushMessage[] = valid.map((recipient) => ({
    to: recipient.token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  let processed = 0;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    tickets.forEach((ticket, index) => {
      const recipient = valid[processed + index];
      if (ticket.status === 'ok' && recipient) {
        insertTicket(ticket.id, recipient.deviceId);
      }
    });
    processed += chunk.length;
  }

  return valid.length;
}
