const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${TELEGRAM_API}${getBotToken()}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const data = (await response.json()) as TelegramResponse;

    if (!data.ok) {
      return { success: false, error: data.description ?? "Telegram API error" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function verifyWebhookSecret(secret: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  return secret === expected;
}
