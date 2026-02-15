import { NextRequest, NextResponse } from "next/server";
import {
  validateDeviceToken,
  getDeviceTokenFromHeader,
  updateDeviceContacts,
} from "@/lib/auth/device-token";

interface UpdateContactBody {
  name?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
}

// PUT /api/contacts/[id] — update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactIndex } = await params;
    const index = parseInt(contactIndex, 10);

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
    if (!record || !record.contacts) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Contact not found." } },
        { status: 404 }
      );
    }

    if (isNaN(index) || index < 0 || index >= record.contacts.length) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Contact not found." } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateContactBody;
    const contacts = [...record.contacts];
    const existing = contacts[index];

    contacts[index] = {
      ...existing,
      ...(body.name && { name: body.name.trim() }),
      ...(body.telegramUsername !== undefined && {
        telegramUsername: body.telegramUsername?.trim(),
      }),
      ...(body.whatsappNumber !== undefined && {
        whatsappNumber: body.whatsappNumber?.trim(),
      }),
    };

    await updateDeviceContacts(deviceToken, contacts);

    return NextResponse.json({ contact: contacts[index] });
  } catch (error) {
    console.error("Contacts PUT error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update contact." } },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] — remove a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactIndex } = await params;
    const index = parseInt(contactIndex, 10);

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
    if (!record || !record.contacts) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Contact not found." } },
        { status: 404 }
      );
    }

    if (isNaN(index) || index < 0 || index >= record.contacts.length) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Contact not found." } },
        { status: 404 }
      );
    }

    const contacts = record.contacts.filter((_, i) => i !== index);
    await updateDeviceContacts(deviceToken, contacts);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contacts DELETE error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete contact." } },
      { status: 500 }
    );
  }
}
