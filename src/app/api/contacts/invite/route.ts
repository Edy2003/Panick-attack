import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/db-admin";
import { id } from "@instantdb/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";

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

    // Check max invites (10 per user)
    const existingContacts = await adminDb.query({
      emergencyContacts: {
        $: { where: { "owner.id": userId } },
      },
    });

    if (existingContacts.emergencyContacts.length >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 contacts allowed" },
        { status: 400 }
      );
    }

    // Generate unique invite token
    const inviteToken = crypto.randomUUID();
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      return NextResponse.json(
        { error: "Bot username not configured" },
        { status: 500 }
      );
    }

    // Create pending contact
    const contactId = id();
    await adminDb.transact([
      adminDb.tx.emergencyContacts[contactId]
        .update({
          displayName: "Pending...",
          telegramChatId: "", // Will be filled on acceptance
          telegramChatType: "",
          inviteToken,
          invitedAt: new Date(),
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .link({ owner: userId }),
    ]);

    // Generate Telegram deep link
    const inviteLink = `https://t.me/${botUsername}?start=${inviteToken}`;

    return NextResponse.json({
      inviteLink,
      inviteToken,
      contactId,
    });
  } catch (error) {
    console.error("Invite generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invite" },
      { status: 500 }
    );
  }
}
