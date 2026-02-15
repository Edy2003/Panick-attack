import { NextRequest, NextResponse } from "next/server";
import {
  validateDeviceToken,
  getDeviceTokenFromHeader,
} from "@/lib/auth/device-token";
import { sendTelegramMessage } from "@/lib/messaging/telegram";
import { sendWhatsAppMessage } from "@/lib/messaging/whatsapp";
import { formatSOSMessage } from "@/lib/messaging/message-template";
import { adminDb } from "@/lib/db-admin";

const MAX_SOS_PER_10MIN = 5;
const MAX_SOS_LIMITER_ENTRIES = 10000;

// In-memory rate limiter
const sosRateLimiter = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkSOSRateLimit(token: string): boolean {
  const now = Date.now();

  // Prevent unbounded growth
  if (sosRateLimiter.size > MAX_SOS_LIMITER_ENTRIES) {
    for (const [key, entry] of sosRateLimiter) {
      if (now > entry.resetAt) sosRateLimiter.delete(key);
    }
  }

  const entry = sosRateLimiter.get(token);

  if (!entry || now > entry.resetAt) {
    sosRateLimiter.set(token, { count: 1, resetAt: now + 600_000 });
    return true;
  }

  if (entry.count >= MAX_SOS_PER_10MIN) return false;

  entry.count += 1;
  return true;
}

interface SOSRequestBody {
  location?: { lat: number; lng: number };
  language?: "uk" | "en";
}

interface ContactForSOS {
  id: string;
  name: string;
  telegramChatId?: string;
  whatsappNumber?: string;
}

async function getContactsForToken(
  token: string
): Promise<ContactForSOS[]> {
  // Try device token contacts (anon mode)
  const deviceRecord = await validateDeviceToken(token);
  if (!deviceRecord) return [];

  // Device token contacts are stored as JSON
  return (deviceRecord.contacts ?? [])
    .filter(
      (c) => c.telegramChatId || c.whatsappNumber
    )
    .map((c, i) => ({
      id: `device-${i}`,
      name: c.name,
      telegramChatId: c.telegramChatId,
      whatsappNumber: c.whatsappNumber,
    }));
}

async function getContactsForUser(
  userId: string
): Promise<ContactForSOS[]> {
  const result = await adminDb.query({
    emergencyContacts: {
      $: { where: { "owner.id": userId, isActive: true } },
    },
  });

  return (result.emergencyContacts ?? [])
    .filter(
      (c) =>
        c.telegramChatId || c.whatsappNumber
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      telegramChatId: c.telegramChatId ?? undefined,
      whatsappNumber: c.whatsappNumber ?? undefined,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const deviceToken = getDeviceTokenFromHeader(
      request.headers.get("x-device-token")
    );

    if (!deviceToken) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_TOKEN",
            message: "Valid device token is required.",
          },
        },
        { status: 401 }
      );
    }

    if (!checkSOSRateLimit(deviceToken)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many SOS requests. Please wait.",
          },
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as SOSRequestBody;
    const language = body.language === "en" ? "en" : "uk";
    const location = body.location;

    // Validate location if provided
    if (location) {
      if (
        typeof location.lat !== "number" ||
        typeof location.lng !== "number" ||
        location.lat < -90 ||
        location.lat > 90 ||
        location.lng < -180 ||
        location.lng > 180
      ) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_LOCATION",
              message: "Invalid location coordinates.",
            },
          },
          { status: 400 }
        );
      }
    }

    // Get contacts — try device token first, then authenticated user
    let contacts = await getContactsForToken(deviceToken);

    if (contacts.length === 0) {
      // Try auth-based contacts if user is authenticated
      const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
      if (authToken) {
        try {
          const user = await adminDb.auth.verifyToken(authToken);
          if (user?.id) {
            contacts = await getContactsForUser(user.id);
          }
        } catch {
          // Auth verification failed, continue with empty contacts
        }
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "NO_CONTACTS",
            message:
              language === "uk"
                ? "Немає налаштованих контактів. Додайте контакти в налаштуваннях."
                : "No contacts configured. Add contacts in settings.",
          },
        },
        { status: 400 }
      );
    }

    // Build SOS message (userName from body or default)
    const message = formatSOSMessage({
      userName: language === "uk" ? "Користувач" : "User",
      language,
      location,
      timestamp: new Date(),
    });

    // Send to all contacts in parallel
    const results = await Promise.all(
      contacts.flatMap((contact) => {
        const sends: Promise<{
          contactId: string;
          channel: string;
          status: "sent" | "failed";
          error?: string;
        }>[] = [];

        if (contact.telegramChatId) {
          sends.push(
            sendTelegramMessage(contact.telegramChatId, message).then(
              (r) => ({
                contactId: contact.id,
                channel: "telegram",
                status: r.success ? ("sent" as const) : ("failed" as const),
                error: r.error,
              })
            )
          );
        }

        if (contact.whatsappNumber) {
          sends.push(
            sendWhatsAppMessage(contact.whatsappNumber, message).then(
              (r) => ({
                contactId: contact.id,
                channel: "whatsapp",
                status: r.success ? ("sent" as const) : ("failed" as const),
                error: r.error,
              })
            )
          );
        }

        return sends;
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("SOS API error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send SOS. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
