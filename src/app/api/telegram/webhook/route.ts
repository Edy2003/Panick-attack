import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret } from "@/lib/messaging/telegram";
import { adminDb } from "@/lib/db-admin";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (!verifyWebhookSecret(secret)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    // Handle /start {inviteToken} command
    if (text.startsWith("/start ")) {
      const inviteToken = text.replace("/start ", "").trim();

      if (!inviteToken) {
        return NextResponse.json({ ok: true });
      }

      // Find contact by invite token
      const result = await adminDb.query({
        emergencyContacts: {
          $: { where: { inviteToken } },
        },
      });

      const contact = result.emergencyContacts?.[0];

      if (!contact) {
        // Token not found — send error to user
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "Посилання недійсне або вже використане. / Link is invalid or already used.",
              }),
            }
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Check if already accepted
      if (contact.acceptedAt) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "Це запрошення вже використано. / This invite has already been used.",
              }),
            }
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Get chat info from Telegram API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return NextResponse.json({ ok: true });
      }

      const chatInfoResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`
      );
      const chatInfoData = await chatInfoResponse.json();

      if (!chatInfoData.ok) {
        console.error("Failed to get chat info:", chatInfoData);
        return NextResponse.json({ ok: true });
      }

      const chatInfo = chatInfoData.result;
      const chatType = chatInfo.type; // 'private', 'group', 'supergroup'
      const chatTitle = chatInfo.title || chatInfo.first_name || "Unknown";
      const chatPhoto = chatInfo.photo?.big_file_id;

      // Update contact with chat details
      await adminDb.transact([
        adminDb.tx.emergencyContacts[contact.id].update({
          telegramChatId: chatId,
          telegramChatType: chatType,
          telegramChatTitle: chatTitle,
          telegramChatPhoto: chatPhoto,
          displayName: chatTitle,
          acceptedAt: new Date(),
          isActive: true,
          updatedAt: new Date(),
        }),
      ]);

      // Send confirmation based on chat type
      let confirmText = "";
      if (chatType === "private") {
        confirmText = `✅ Вас підключено як екстрений контакт у PanicAttack Helper.\n\n✅ You are now connected as an emergency contact in PanicAttack Helper.`;
      } else {
        confirmText = `✅ Цю групу підключено як екстрений контакт у PanicAttack Helper.\n\n✅ This group is now registered as an emergency contact in PanicAttack Helper.`;
      }

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: confirmText,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
