/** Supported learning languages (multi-language by design). */
export type LanguageCode = 'zh-TW' | 'zh-CN' | 'en' | 'es' | 'fr' | 'ko' | 'ja';

export interface ExampleSentence {
  /** Sentence in the target language. */
  text: string;
  /** Translation in the learner's native language. */
  translation: string;
}

/** A captured vocabulary card — the "Pokémon card" of a single word. */
export interface VocabCard {
  id: string;
  /** Emoji or image URI standing in for the cut-out subject sticker. */
  sticker: string;
  /** Original photo reference (emoji/URI placeholder in mock). */
  photo: string;

  targetLanguage: LanguageCode;

  // --- Dictionary-sourced (authoritative) ---
  word: string;
  reading: string; // pinyin / kana / IPA
  ipa: string;
  meaning: string; // in native language
  partOfSpeech: string;
  level: string; // CEFR / HSK / etc.

  // --- AI-enriched (Claude) ---
  examples: ExampleSentence[];
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
  etymology: string;
  note: string; // a memorable one-liner about the word

  // --- Audio ---
  audioUri: string | null; // native pronunciation (TTS), cached

  // --- Classification & collection ---
  categoryId: string;

  // --- SRS state (hidden spaced repetition) ---
  srs: SrsState;

  // --- Capture metadata ---
  capturedAt: string; // ISO date
  location?: { latitude: number; longitude: number; name?: string };
  /** A large "with me" selfie shown on the card back (optional, private by default). */
  selfPhoto?: string | null;
  /** The learner's one-line note at capture — feeds the AI diary. */
  userComment?: string | null;
  /** How the card was created. */
  source?: 'object' | 'selfie' | 'library' | 'ocr';
}

export interface SrsState {
  /** SM-2 ease factor. */
  ease: number;
  /** Current inter-repetition interval in days. */
  intervalDays: number;
  /** Number of consecutive correct recalls. */
  repetitions: number;
  /** ISO date of the next scheduled review. */
  dueAt: string;
  /** How many times the user has forgotten this card (drives photo blur). */
  lapses: number;
}

/** Pokédex-style category that groups cards. */
export interface Category {
  id: string;
  name: string; // native-language label
  emoji: string;
  /** Optional curated target words for this category (for "?" locked slots). */
  targetWords?: string[];
}

/** One day's photo-diary scrapbook page. */
export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  cardIds: string[];
  note?: string;
}

/** A candidate the identifier proposes for an ambiguous photo. */
export interface IdentifyCandidate {
  word: string; // target language
  reading: string;
  nativeTranslation: string; // confirmation in native language
  emoji: string;
  categoryId: string;
  confidence: number; // 0..1
}

/** User profile & gamification state. */
export interface Profile {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  plan: 'free' | 'pro';
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  /** Hour (0-23) the user typically studies — drives next-day reminders. */
  habitHour: number | null;
  /** Pronunciation-judging strictness for SRS repair. */
  pronStrictness?: 'lenient' | 'normal' | 'strict';
  /** Certification word-count goal, e.g. TOEFL. */
  goal?: { name: string; requiredWords: number };
}
