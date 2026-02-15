export interface Article {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string; // markdown
  source?: string;
  sourceUrl?: string;
}

const articlesUk: Article[] = [
  {
    slug: "what-is-panic-attack",
    title: "Що таке панічна атака?",
    summary:
      "Панічна атака — це раптовий напад інтенсивного страху з фізичними симптомами. Це не небезпечно, хоча дуже лякає.",
    category: "psychoeducation",
    content: `## Що відбувається під час панічної атаки?

Панічна атака — це раптовий спалах інтенсивної тривоги, який супроводжується фізичними симптомами: прискорене серцебиття, задишка, запаморочення, тремтіння, відчуття нереальності.

### Чому це відбувається?

Ваше тіло активує реакцію \"бий або тікай\" (fight-or-flight) без реальної загрози. Мигдалеподібне тіло мозку надсилає хибний сигнал небезпеки, і організм реагує так, ніби ви в загрозі.

### Важливо знати:

- **Панічна атака НЕ небезпечна для життя** — хоча відчуття дуже лякають
- **Вона завжди закінчується** — зазвичай через 10-30 хвилин
- **Ви не збожеволієте** — це нормальна реакція тіла на стрес
- **Серце витримає** — прискорене серцебиття під час паніки не шкодить серцю

### Що робити прямо зараз?

1. Нагадайте собі: \"Це панічна атака. Вона пройде.\"
2. Дихайте повільно: вдих 4 секунди, видих 8 секунд
3. Заземліться: назвіть 5 речей, які бачите навколо
4. Не боріться з відчуттями — дозвольте їм бути`,
    source: "NIMH",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/panic-disorder",
  },
  {
    slug: "cbt-self-help",
    title: "CBT техніки для самодопомоги",
    summary:
      "Когнітивно-поведінкова терапія (КПТ) — найефективніший метод лікування панічних атак. Ось техніки, які можна застосовувати самостійно.",
    category: "techniques",
    content: `## Когнітивно-поведінкова терапія при паніці

КПТ допомагає змінити мисленнєві шаблони, які підтримують паніку.

### 1. Когнітивне переосмислення

Під час паніки ми часто думаємо катастрофічно:
- \"Я зараз помру\" → \"Мій організм реагує на стрес, це безпечно\"
- \"Я втрачаю контроль\" → \"Я відчуваю тривогу, але я тут, я в свідомості\"
- \"Це ніколи не закінчиться\" → \"Панічні атаки завжди закінчуються, зазвичай через 10-20 хвилин\"

### 2. Поступова експозиція

Поступово зустрічайтесь із ситуаціями, які викликають тривогу, починаючи з найлегших.

### 3. Техніка СТОП

1. **С**топ — зупиніть думки
2. **Т**ело — відчуйте своє тіло
3. **О**цініть — що я думаю? Це факт чи катастрофізація?
4. **П**лан — що я зроблю зараз?

### 4. Щоденник думок

Записуйте тривожні думки та знаходьте альтернативні, більш збалансовані пояснення.`,
    source: "APA",
    sourceUrl: "https://www.apa.org/topics/anxiety",
  },
  {
    slug: "grounding-mindfulness",
    title: "Grounding та mindfulness техніки",
    summary:
      "Прості техніки заземлення допомагають повернутися до реальності під час деперсоналізації та дисоціації.",
    category: "techniques",
    content: `## Заземлення — повернення до \"тут і зараз\"

Під час панічної атаки може виникати відчуття нереальності (деперсоналізація/дереалізація). Заземлення допомагає \"повернутися\" у своє тіло.

### Техніка 5-4-3-2-1

1. **5** речей, які ви **бачите**
2. **4** речі, які ви можете **торкнутися**
3. **3** звуки, які ви **чуєте**
4. **2** запахи, які ви **відчуваєте**
5. **1** смак

### Фізичне заземлення

- Потримайте кубик льоду в руці
- Помийте обличчя холодною водою
- Щільно стисніть і розслабте кулаки
- Натисніть ступнями на підлогу

### Дихальне заземлення

- Квадратне дихання: вдих 4с → затримка 4с → видих 4с → затримка 4с
- Техніка 4-7-8: вдих 4с → затримка 7с → видих 8с

### Mindfulness

Спостерігайте за своїми відчуттями без оцінки. Скажіть собі: \"Я зараз відчуваю тривогу. Це нормально. Це пройде.\"`,
    source: "WHO",
    sourceUrl: "https://www.who.int/health-topics/mental-health",
  },
  {
    slug: "supporting-someone",
    title: "Як підтримати близьку людину",
    summary:
      "Практичні поради для тих, чий близький страждає від панічних атак та тривожного розладу.",
    category: "support",
    content: `## Як допомогти під час панічної атаки

### Що робити:

- **Залишайтесь спокійними** — ваш спокій допоможе заспокоїтись іншій людині
- **Говоріть тихо та повільно** — \"Я тут. Ти в безпеці.\"
- **Допоможіть дихати** — дихайте разом повільно
- **Запитайте, що потрібно** — \"Як я можу тобі допомогти?\"
- **Будьте терплячими** — атака пройде, просто будьте поруч

### Чого НЕ робити:

- Не кажіть \"заспокойся\" або \"не хвилюйся\"
- Не применшуйте відчуття — \"та тут нема чого боятись\"
- Не тисніть — \"ти ж доросла людина\"
- Не залишайте одну (якщо не просять)
- Не робіть різких рухів

### Після атаки:

- Запитайте, як людина себе почуває
- Не аналізуйте, що \"спровокувало\" атаку — це не завжди зрозуміло
- Запропонуйте воду
- Підтримайте рішення звернутися до фахівця`,
    source: "NIMH",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/panic-disorder",
  },
  {
    slug: "when-to-seek-help",
    title: "Коли звертатися до спеціаліста",
    summary:
      "Панічні атаки піддаються лікуванню. Ось ознаки того, що варто звернутися по професійну допомогу.",
    category: "professional",
    content: `## Коли потрібна професійна допомога?

### Зверніться до психотерапевта, якщо:

- Панічні атаки повторюються регулярно (щотижня або частіше)
- Ви уникаєте місць або ситуацій через страх панічної атаки
- Тривога заважає роботі, навчанню або стосункам
- Ви постійно хвилюєтесь про нову атаку
- Якість життя значно знизилась

### Що може допомогти:

- **Когнітивно-поведінкова терапія (КПТ)** — золотий стандарт лікування
- **Медикаментозне лікування** — за призначенням лікаря (SSRI, бензодіазепіни)
- **Комбінований підхід** — терапія + медикаменти

### Як знайти спеціаліста в Україні:

- Попросіть направлення у сімейного лікаря
- Зверніться до центру психічного здоров'я у вашому місті
- Лайфлайн Україна (7333) може порекомендувати спеціаліста

### Термінова допомога:

Якщо ви або ваш близький в кризі — телефонуйте **7333** (Лайфлайн Україна)`,
    source: "APA",
    sourceUrl: "https://www.apa.org/topics/anxiety",
  },
  {
    slug: "medication-info",
    title: "Медикаментозне лікування: загальна інформація",
    summary:
      "Огляд медикаментів, які використовуються при панічному розладі. Тільки загальна інформація — призначати може лише лікар.",
    category: "professional",
    content: `## Медикаменти при панічному розладі

**Важливо: ця інформація є загальною. Будь-які медикаменти повинен призначати лікар.**

### Основні групи:

#### SSRI (селективні інгібітори зворотного захоплення серотоніну)
- Перша лінія лікування
- Ефект настає через 2-4 тижні
- Приймаються щоденно, не \"по потребі\"

#### Бензодіазепіни
- Швидка дія (10-30 хвилин)
- Призначаються короткостроково через ризик залежності
- НЕ для постійного прийому

#### SNRI (інгібітори зворотного захоплення серотоніну та норадреналіну)
- Альтернатива SSRI
- Також потребують 2-4 тижні для ефекту

### Важливо знати:

- Не припиняйте прийом різко — поступове зниження дози під контролем лікаря
- Побічні ефекти зазвичай зменшуються через 1-2 тижні
- Медикаменти найефективніші у поєднанні з психотерапією
- Панічний розлад лікується — більшість людей відчувають значне покращення`,
    source: "Cochrane Reviews",
    sourceUrl: "https://www.cochranelibrary.com",
  },
];

const articlesEn: Article[] = [
  {
    slug: "what-is-panic-attack",
    title: "What is a panic attack?",
    summary:
      "A panic attack is a sudden episode of intense fear with physical symptoms. It's not dangerous, although it feels terrifying.",
    category: "psychoeducation",
    content: `## What happens during a panic attack?

A panic attack is a sudden surge of intense anxiety accompanied by physical symptoms: rapid heartbeat, shortness of breath, dizziness, trembling, feeling of unreality.

### Why does it happen?

Your body activates the fight-or-flight response without a real threat. The amygdala sends a false danger signal, and your body reacts as if you're in danger.

### Important to know:

- **A panic attack is NOT life-threatening** — although it feels terrifying
- **It always ends** — usually within 10-30 minutes
- **You're not going crazy** — it's a normal stress response
- **Your heart can handle it** — rapid heartbeat during panic doesn't harm your heart

### What to do right now?

1. Remind yourself: "This is a panic attack. It will pass."
2. Breathe slowly: inhale 4 seconds, exhale 8 seconds
3. Ground yourself: name 5 things you can see
4. Don't fight the feelings — allow them to be`,
    source: "NIMH",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/panic-disorder",
  },
  {
    slug: "cbt-self-help",
    title: "CBT self-help techniques",
    summary:
      "Cognitive Behavioral Therapy (CBT) is the most effective treatment for panic attacks. Here are techniques you can use on your own.",
    category: "techniques",
    content: `## Cognitive Behavioral Therapy for panic

CBT helps change thinking patterns that maintain panic.

### 1. Cognitive reframing

During panic, we often think catastrophically:
- "I'm going to die" → "My body is responding to stress, this is safe"
- "I'm losing control" → "I feel anxious, but I'm here, I'm conscious"
- "This will never end" → "Panic attacks always end, usually in 10-20 minutes"

### 2. Gradual exposure

Gradually face situations that cause anxiety, starting with the easiest ones.

### 3. The STOP technique

1. **S**top — pause your thoughts
2. **T**une in — feel your body
3. **O**bserve — what am I thinking? Is this fact or catastrophizing?
4. **P**lan — what will I do now?

### 4. Thought diary

Write down anxious thoughts and find alternative, more balanced explanations.`,
    source: "APA",
    sourceUrl: "https://www.apa.org/topics/anxiety",
  },
  {
    slug: "grounding-mindfulness",
    title: "Grounding and mindfulness techniques",
    summary:
      "Simple grounding techniques help reconnect with reality during depersonalization and dissociation.",
    category: "techniques",
    content: `## Grounding — returning to the "here and now"

During a panic attack, you may feel unreal (depersonalization/derealization). Grounding helps you "come back" to your body.

### The 5-4-3-2-1 technique

1. **5** things you can **see**
2. **4** things you can **touch**
3. **3** sounds you can **hear**
4. **2** things you can **smell**
5. **1** thing you can **taste**

### Physical grounding

- Hold an ice cube in your hand
- Wash your face with cold water
- Clench and release your fists tightly
- Press your feet firmly against the floor

### Breathing grounding

- Box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s
- 4-7-8 technique: inhale 4s → hold 7s → exhale 8s

### Mindfulness

Observe your sensations without judgment. Tell yourself: "I'm feeling anxiety right now. That's okay. It will pass."`,
    source: "WHO",
    sourceUrl: "https://www.who.int/health-topics/mental-health",
  },
  {
    slug: "supporting-someone",
    title: "How to support someone with anxiety",
    summary:
      "Practical advice for those whose loved one suffers from panic attacks and anxiety disorder.",
    category: "support",
    content: `## How to help during a panic attack

### What to do:

- **Stay calm** — your calm will help the other person calm down
- **Speak softly and slowly** — "I'm here. You're safe."
- **Help with breathing** — breathe slowly together
- **Ask what's needed** — "How can I help you?"
- **Be patient** — the attack will pass, just be there

### What NOT to do:

- Don't say "calm down" or "don't worry"
- Don't minimize feelings — "there's nothing to be afraid of"
- Don't pressure — "you're an adult"
- Don't leave them alone (unless asked)
- Don't make sudden movements

### After the attack:

- Ask how the person feels
- Don't analyze what "triggered" the attack — it's not always clear
- Offer water
- Support the decision to seek professional help`,
    source: "NIMH",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/panic-disorder",
  },
  {
    slug: "when-to-seek-help",
    title: "When to seek professional help",
    summary:
      "Panic attacks are treatable. Here are signs that it's time to seek professional help.",
    category: "professional",
    content: `## When is professional help needed?

### See a therapist if:

- Panic attacks occur regularly (weekly or more)
- You avoid places or situations due to fear of a panic attack
- Anxiety interferes with work, school, or relationships
- You constantly worry about the next attack
- Quality of life has significantly decreased

### What can help:

- **Cognitive Behavioral Therapy (CBT)** — the gold standard of treatment
- **Medication** — prescribed by a doctor (SSRIs, benzodiazepines)
- **Combined approach** — therapy + medication

### Finding a specialist:

- Ask your family doctor for a referral
- Contact a mental health center in your city
- Lifeline Ukraine (7333) can recommend a specialist

### Emergency help:

If you or someone you know is in crisis — call **7333** (Lifeline Ukraine)`,
    source: "APA",
    sourceUrl: "https://www.apa.org/topics/anxiety",
  },
  {
    slug: "medication-info",
    title: "Medication treatment: general information",
    summary:
      "Overview of medications used for panic disorder. General information only — only a doctor can prescribe medication.",
    category: "professional",
    content: `## Medications for panic disorder

**Important: This is general information. All medications must be prescribed by a doctor.**

### Main groups:

#### SSRIs (Selective Serotonin Reuptake Inhibitors)
- First-line treatment
- Effect develops over 2-4 weeks
- Taken daily, not "as needed"

#### Benzodiazepines
- Fast-acting (10-30 minutes)
- Prescribed short-term due to dependence risk
- NOT for long-term daily use

#### SNRIs (Serotonin-Norepinephrine Reuptake Inhibitors)
- Alternative to SSRIs
- Also require 2-4 weeks for effect

### Important to know:

- Don't stop abruptly — gradual dose reduction under doctor's supervision
- Side effects usually decrease after 1-2 weeks
- Medications are most effective combined with psychotherapy
- Panic disorder is treatable — most people experience significant improvement`,
    source: "Cochrane Reviews",
    sourceUrl: "https://www.cochranelibrary.com",
  },
];

const ARTICLES: Record<string, Article[]> = {
  uk: articlesUk,
  en: articlesEn,
};

export function getArticles(locale: string): Article[] {
  return ARTICLES[locale] ?? ARTICLES["uk"];
}

export function getArticle(
  locale: string,
  slug: string
): Article | undefined {
  return getArticles(locale).find((a) => a.slug === slug);
}

export function searchArticles(locale: string, query: string): Article[] {
  const q = query.toLowerCase().trim();
  if (!q) return getArticles(locale);

  return getArticles(locale).filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );
}

// Categories for filtering
export const CATEGORIES = [
  "psychoeducation",
  "techniques",
  "support",
  "professional",
] as const;

// Bookmarks (localStorage)
const BOOKMARKS_KEY = "panic-helper:bookmarks";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(slug: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(slug);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(slug);
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return index < 0; // returns true if added
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}
