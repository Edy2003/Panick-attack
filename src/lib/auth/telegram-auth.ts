import crypto from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies Telegram Login Widget authentication data
 * using HMAC-SHA256 signature verification
 *
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const { hash, ...fields } = data;

  // Create data-check-string from sorted fields
  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key as keyof typeof fields]}`)
    .join("\n");

  // Create secret key from bot token
  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  // Calculate HMAC-SHA256
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  // Compare hashes using constant-time comparison
  return timingSafeEqual(hmac, hash);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  return crypto.timingSafeEqual(bufA, bufB);
}
