interface SOSMessageParams {
  userName: string;
  language: "uk" | "en";
  location?: { lat: number; lng: number };
  timestamp: Date;
}

export function formatSOSMessage(params: SOSMessageParams): string {
  const { userName, language, location, timestamp } = params;
  const isUk = language === "uk";

  const time = timestamp.toLocaleString(isUk ? "uk-UA" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const locationLine = location
    ? `\n📍 ${isUk ? "Локація" : "Location"}: https://www.google.com/maps?q=${location.lat},${location.lng}`
    : "";

  if (isUk) {
    return `🆘 SOS — ${userName}

${userName} повідомляє: "У мене панічна атака, мені потрібна підтримка."
${locationLine}
🕐 Час: ${time}

Цей контакт налаштований як екстрений у застосунку PanicAttack Helper.`;
  }

  return `🆘 SOS — ${userName}

${userName} says: "I'm having a panic attack, I need support."
${locationLine}
🕐 Time: ${time}

This contact is configured as emergency in PanicAttack Helper app.`;
}
