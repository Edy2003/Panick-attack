function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return { accountSid, authToken, from };
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const config = getTwilioConfig();

  if (!config) {
    return { success: false, error: "WhatsApp (Twilio) is not configured" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: `whatsapp:${config.from}`,
      To: `whatsapp:${to}`,
      Body: text,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
            "base64"
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message ?? `Twilio error: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isWhatsAppConfigured(): boolean {
  return getTwilioConfig() !== null;
}
