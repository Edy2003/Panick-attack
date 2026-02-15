import { adminDb } from "@/lib/db-admin";
import { id } from "@instantdb/admin";

interface DeviceContact {
  name: string;
  telegramChatId?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
}

interface DeviceTokenRecord {
  id: string;
  token: string;
  contacts: DeviceContact[];
  createdAt: number;
}

export async function validateDeviceToken(
  token: string
): Promise<DeviceTokenRecord | null> {
  if (!token || typeof token !== "string") return null;

  const result = await adminDb.query({
    deviceTokens: { $: { where: { token } } },
  });

  const record = result.deviceTokens?.[0];
  if (!record) return null;

  return record as unknown as DeviceTokenRecord;
}

export async function createDeviceToken(
  token: string,
  contacts: DeviceContact[] = []
): Promise<string> {
  const newId = id();

  await adminDb.transact(
    adminDb.tx.deviceTokens[newId].update({
      token,
      contacts,
      createdAt: Date.now(),
    })
  );

  return newId;
}

export async function updateDeviceContacts(
  token: string,
  contacts: DeviceContact[]
): Promise<boolean> {
  const record = await validateDeviceToken(token);
  if (!record) return false;

  await adminDb.transact(
    adminDb.tx.deviceTokens[record.id].update({ contacts })
  );

  return true;
}

export function getDeviceTokenFromHeader(
  headerValue: string | null
): string | null {
  if (!headerValue || typeof headerValue !== "string") return null;

  // Basic UUID format check
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(headerValue)) return null;

  return headerValue;
}
