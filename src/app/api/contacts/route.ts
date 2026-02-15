import { NextRequest, NextResponse } from "next/server";
import {
  validateDeviceToken,
  getDeviceTokenFromHeader,
  createDeviceToken,
  updateDeviceContacts,
} from "@/lib/auth/device-token";
import { adminDb } from "@/lib/db-admin";
import { id } from "@instantdb/admin";

interface CreateContactBody {
  name: string;
  telegramUsername?: string;
  whatsappNumber?: string;
}

// GET /api/contacts — list contacts for device token
export async function GET(request: NextRequest) {
  try {
    const deviceToken = getDeviceTokenFromHeader(
      request.headers.get("x-device-token")
    );

    if (!deviceToken) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Valid device token is required." } },
        { status: 401 }
      );
    }

    const record = await validateDeviceToken(deviceToken);

    if (!record) {
      return NextResponse.json({ contacts: [] });
    }

    return NextResponse.json({ contacts: record.contacts ?? [] });
  } catch (error) {
    console.error("Contacts GET error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch contacts." } },
      { status: 500 }
    );
  }
}

// POST /api/contacts — add a contact
export async function POST(request: NextRequest) {
  try {
    const deviceToken = getDeviceTokenFromHeader(
      request.headers.get("x-device-token")
    );

    if (!deviceToken) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Valid device token is required." } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateContactBody;

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_NAME", message: "Contact name is required." } },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { error: { code: "NAME_TOO_LONG", message: "Name must be under 100 characters." } },
        { status: 400 }
      );
    }

    if (!body.telegramUsername && !body.whatsappNumber) {
      return NextResponse.json(
        {
          error: {
            code: "NO_CHANNEL",
            message: "At least one contact method (Telegram or WhatsApp) is required.",
          },
        },
        { status: 400 }
      );
    }

    // Generate link token for Telegram deep link
    const linkToken = body.telegramUsername ? id() : undefined;

    const newContact = {
      name: body.name.trim(),
      telegramUsername: body.telegramUsername?.trim(),
      telegramChatId: undefined,
      whatsappNumber: body.whatsappNumber?.trim(),
      linkToken,
    };

    // Check max contacts limit
    const MAX_CONTACTS = 10;
    let record = await validateDeviceToken(deviceToken);

    if (record && (record.contacts?.length ?? 0) >= MAX_CONTACTS) {
      return NextResponse.json(
        { error: { code: "MAX_CONTACTS", message: "Maximum 10 contacts allowed." } },
        { status: 400 }
      );
    }

    if (!record) {
      await createDeviceToken(deviceToken, [newContact]);
    } else {
      const contacts = [...(record.contacts ?? []), newContact];
      await updateDeviceContacts(deviceToken, contacts);
    }

    return NextResponse.json({
      contact: newContact,
      telegramLink: linkToken
        ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME ?? "PanicAttackHelperBot"}?start=${linkToken}`
        : undefined,
    });
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to add contact." } },
      { status: 500 }
    );
  }
}
