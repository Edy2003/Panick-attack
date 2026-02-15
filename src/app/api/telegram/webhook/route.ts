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

    // Handle /start {link_token} command
    if (text.startsWith("/start ")) {
      const linkToken = text.replace("/start ", "").trim();

      if (!linkToken) {
        return NextResponse.json({ ok: true });
      }

      // Find contact by link token
      const result = await adminDb.query({
        emergencyContacts: {
          $: { where: { telegramLinkToken: linkToken } },
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

      // Save telegram chat ID to contact
      await adminDb.transact(
        adminDb.tx.emergencyContacts[contact.id].update({
          telegramChatId: chatId,
          isActive: true,
          updatedAt: Date.now(),
        })
      );

      // Send confirmation to contact
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const contactName = message.from?.first_name ?? "Friend";
        await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ ${contactName}, вас підключено як екстрений контакт для ${contact.name} у застосунку PanicAttack Helper.\n\n✅ ${contactName}, you are now connected as an emergency contact for ${contact.name} in PanicAttack Helper app.`,
            }),
          }
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
