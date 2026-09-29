import { deleteTickets, disableDevice, listTickets } from '../db/repository';
import { expo } from '../services/expo-push';

export async function checkPushReceipts(): Promise<void> {
  const tickets = listTickets();
  if (tickets.length === 0) return;

  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket.device_id]));
  const chunks = expo.chunkPushNotificationReceiptIds(tickets.map((ticket) => ticket.id));

  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'error') {
          if (receipt.details?.error === 'DeviceNotRegistered') {
            const deviceId = byId.get(receiptId);
            if (deviceId) disableDevice(deviceId);
          } else {
            console.error(`[receipts] ${receiptId}: ${receipt.message ?? 'error'}`);
          }
        }
      }
    } catch (error) {
      console.error('[receipts] fallo al consultar recibos', error);
    } finally {
      deleteTickets(chunk);
    }
  }
}
