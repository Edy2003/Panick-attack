import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/messaging/telegram";
import { formatSOSMessage } from "@/lib/messaging/message-template";
import { adminDb } from "@/lib/db-admin";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";

const MAX_SOS_PER_10MIN = 5;
const MAX_SOS_LIMITER_ENTRIES = 10000;

// In-memory rate limiter (now using user ID instead of device token)
const sosRateLimiter = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkSOSRateLimit(userId: string): boolean {
  const now = Date.now();

  // Prevent unbounded growth
  if (sosRateLimiter.size > MAX_SOS_LIMITER_ENTRIES) {
    for (const [key, entry] of sosRateLimiter) {
      if (now > entry.resetAt) sosRateLimiter.delete(key);
    }
  }

  const entry = sosRateLimiter.get(userId);

  if (!entry || now > entry.resetAt) {
    sosRateLimiter.set(userId, { count: 1, resetAt: now + 600_000 });
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

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from secure cookies
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check rate limit
    if (!checkSOSRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many SOS requests. Please wait." },
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
          { error: "Invalid location coordinates" },
          { status: 400 }
        );
      }
    }

    // Get user profile for display name
    // Note: profile might be undefined if user hasn't completed profile setup
    const profileResult = await adminDb.query({
      profiles: {
        $: { where: { "owner.id": userId } },
      },
    });

    const profile = profileResult.profiles[0];
    // Safe fallback chain: use displayName, then telegramFirstName, then default
    const userName =
      profile?.displayName ||
      profile?.telegramFirstName ||
      (language === "uk" ? "Користувач" : "User");

    // Get user's active contacts
    const contactsResult = await adminDb.query({
      emergencyContacts: {
        $: {
          where: {
            "owner.id": userId,
            isActive: true,
          },
        },
      },
    });

    const contacts = contactsResult.emergencyContacts || [];

    if (contacts.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "uk"
              ? "Немає налаштованих контактів. Додайте контакти в налаштуваннях."
              : "No contacts configured. Add contacts in settings.",
        },
        { status: 400 }
      );
    }

    // Build SOS message
    const message = formatSOSMessage({
      userName,
      language,
      location,
      timestamp: new Date(),
    });

    // Send to all contacts via Telegram
    const results = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const result = await sendTelegramMessage(
            contact.telegramChatId,
            message
          );

          return {
            contactId: contact.id,
            status: result.success ? ("sent" as const) : ("failed" as const),
            error: result.error,
          };
        } catch (error) {
          return {
            contactId: contact.id,
            status: "failed" as const,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("SOS API error:", error);

    return NextResponse.json(
      { error: "Failed to send SOS. Please try again." },
      { status: 500 }
    );
  }
}
