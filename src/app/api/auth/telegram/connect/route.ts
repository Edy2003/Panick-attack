import { NextRequest, NextResponse } from "next/server";
import {
  verifyTelegramAuth,
  type TelegramAuthData,
} from "@/lib/auth/telegram-auth";
import { adminDb } from "@/lib/db-admin";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";

export async function POST(request: NextRequest) {
  try {
    const telegramData: TelegramAuthData = await request.json();

    // Verify Telegram authentication hash
    if (!verifyTelegramAuth(telegramData)) {
      return NextResponse.json(
        { error: "Invalid Telegram authentication" },
        { status: 401 }
      );
    }

    // Get authenticated user from secure cookies
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Find user's profile
    const result = await adminDb.query({
      profiles: {
        $: {
          where: {
            "owner.id": userId,
          },
        },
      },
    });

    const profile = result.profiles[0];

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update profile with Telegram data
    await adminDb.transact([
      adminDb.tx.profiles[profile.id].update({
        telegramUserId: telegramData.id.toString(),
        telegramUsername: telegramData.username,
        telegramFirstName: telegramData.first_name,
        telegramPhotoUrl: telegramData.photo_url,
        telegramAuthDate: telegramData.auth_date,
        updatedAt: new Date(),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Telegram account" },
      { status: 500 }
    );
  }
}
