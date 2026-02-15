const CRISIS_KEYWORDS_UK = [
  "суїцид",
  "самогубство",
  "покінчити з життям",
  "не хочу жити",
  "хочу померти",
  "вб'ю себе",
  "вбити себе",
  "порізати себе",
  "самоушкодження",
];

const CRISIS_KEYWORDS_EN = [
  "suicide",
  "kill myself",
  "end my life",
  "don't want to live",
  "want to die",
  "self-harm",
  "hurt myself",
  "cut myself",
];

const CRISIS_KEYWORDS = [...CRISIS_KEYWORDS_UK, ...CRISIS_KEYWORDS_EN];

const DIAGNOSIS_PATTERNS = [
  /you have \w+ disorder/i,
  /you are (diagnosed|suffering from)/i,
  /ви маєте .+ розлад/i,
  /у вас .+ діагноз/i,
  /prescribe|recommend.*medication|призначити.*ліки/i,
];

export interface SafetyCheckResult {
  isCrisis: boolean;
  hasDiagnosis: boolean;
}

export function checkUserMessage(message: string): { isCrisis: boolean } {
  const lowerMessage = message.toLowerCase();
  const isCrisis = CRISIS_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );

  return { isCrisis };
}

export function checkAIResponse(response: string): { hasDiagnosis: boolean } {
  const hasDiagnosis = DIAGNOSIS_PATTERNS.some((pattern) =>
    pattern.test(response)
  );

  return { hasDiagnosis };
}

export function getCrisisResponse(language: "uk" | "en"): string {
  if (language === "uk") {
    return "Я чую тебе і мені важливо, що ти поділився цим. Будь ласка, зверніться до кризової лінії допомоги — зателефонуйте 7333 (Лайфлайн Україна). Там є люди, які можуть допомогти прямо зараз. Ви не одні.";
  }

  return "I hear you and I'm glad you shared this. Please reach out to the crisis helpline — call 7333 (Lifeline Ukraine). There are people who can help you right now. You are not alone.";
}
