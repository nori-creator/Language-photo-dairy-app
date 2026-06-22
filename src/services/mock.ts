import { IdentifyCandidate } from '@/types';
import { CutoutService, EnrichService, EnrichedFields, IdentifyService, TtsService } from './types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A tiny offline "dictionary" so the whole flow is demonstrable without any
 * API keys. Keyed by emoji subjects; when a real photo URI comes in (no emoji
 * match) the identifier falls back to a few sample candidates so the
 * confirmation UI still works. The real implementation will recognize the
 * subject directly from the photo via Claude Vision.
 */
const SEED: Record<string, { candidate: IdentifyCandidate; fields: EnrichedFields }> = {
  '🍎': {
    candidate: { word: '蘋果', reading: 'píngguǒ', nativeTranslation: 'りんご', emoji: '🍎', categoryId: 'fruit', confidence: 0.97 },
    fields: {
      reading: 'píngguǒ', ipa: '/pʰǐŋ.kwò/', meaning: 'りんご（果物）', partOfSpeech: '名詞', level: 'HSK 1',
      examples: [
        { text: '我每天吃一個蘋果。', translation: '私は毎日りんごを1つ食べます。' },
        { text: '這個蘋果很甜。', translation: 'このりんごはとても甘いです。' },
      ],
      collocations: ['紅蘋果（赤いりんご）', '一個蘋果（りんご1個）'],
      synonyms: [], antonyms: [],
      etymology: '「蘋」＋「果」。果実を表す「果」を伴う。',
      note: '台湾の市場で最もよく見る果物のひとつ。',
    },
  },
  '🐶': {
    candidate: { word: '狗', reading: 'gǒu', nativeTranslation: 'いぬ', emoji: '🐶', categoryId: 'animal', confidence: 0.95 },
    fields: {
      reading: 'gǒu', ipa: '/kòʊ/', meaning: 'いぬ', partOfSpeech: '名詞', level: 'HSK 1',
      examples: [
        { text: '我家有一隻狗。', translation: '私の家には犬が1匹います。' },
        { text: '那隻狗很可愛。', translation: 'あの犬はとても可愛い。' },
      ],
      collocations: ['小狗（子犬）', '一隻狗（犬1匹）'],
      synonyms: ['犬'], antonyms: ['貓（ねこ）'],
      etymology: '象形に由来する基本語。',
      note: '量詞は「隻 (zhī)」を使う点に注意。',
    },
  },
  '🚏': {
    candidate: { word: '公車站', reading: 'gōngchēzhàn', nativeTranslation: 'バス停', emoji: '🚏', categoryId: 'sign', confidence: 0.88 },
    fields: {
      reading: 'gōngchēzhàn', ipa: '/kʊ́ŋ.ʈʂʰɤ́.ʈʂân/', meaning: 'バス停', partOfSpeech: '名詞', level: 'HSK 2',
      examples: [
        { text: '公車站在前面。', translation: 'バス停は前方にあります。' },
        { text: '我在公車站等你。', translation: 'バス停であなたを待ちます。' },
      ],
      collocations: ['到公車站（バス停まで）'],
      synonyms: ['巴士站'], antonyms: [],
      etymology: '「公車（路線バス）」＋「站（駅・停留所）」。',
      note: '台湾では「公車」、香港では「巴士」が一般的。',
    },
  },
  '☕': {
    candidate: { word: '咖啡', reading: 'kāfēi', nativeTranslation: 'コーヒー', emoji: '☕', categoryId: 'food', confidence: 0.96 },
    fields: {
      reading: 'kāfēi', ipa: '/kʰá.feɪ/', meaning: 'コーヒー', partOfSpeech: '名詞', level: 'HSK 1',
      examples: [
        { text: '我想喝一杯咖啡。', translation: 'コーヒーを1杯飲みたいです。' },
        { text: '這家的咖啡很好喝。', translation: 'この店のコーヒーはとても美味しい。' },
      ],
      collocations: ['一杯咖啡（コーヒー1杯）', '黑咖啡（ブラックコーヒー）'],
      synonyms: [], antonyms: [],
      etymology: '英語 "coffee" の音訳。',
      note: '量詞は「杯 (bēi)」。',
    },
  },
};

const FALLBACK_KEYS = Object.keys(SEED);

export const mockIdentify: IdentifyService = {
  async identify({ photo }) {
    await delay(700);
    const primary = SEED[photo]?.candidate;
    // Always return a few candidates so the confirmation UI is meaningful.
    const others = FALLBACK_KEYS.filter((k) => k !== photo)
      .slice(0, 2)
      .map((k) => ({ ...SEED[k].candidate, confidence: Math.round((0.3 + Math.random() * 0.3) * 100) / 100 }));
    return primary ? [primary, ...others] : others;
  },
};

export const mockCutout: CutoutService = {
  async cutout({ photo }) {
    await delay(900);
    // No real background removal in the mock: pass the photo (emoji or URI)
    // straight through as the "sticker" so the captured image becomes the card.
    return { sticker: photo };
  },
};

export const mockEnrich: EnrichService = {
  async enrich({ word }) {
    await delay(600);
    const found = Object.values(SEED).find((s) => s.candidate.word === word);
    if (found) return found.fields;
    // Generic fallback for manually entered words.
    return {
      reading: '', ipa: '', meaning: `${word}（辞書データ未取得）`, partOfSpeech: '—', level: '—',
      examples: [], collocations: [], synonyms: [], antonyms: [],
      etymology: '', note: '実APIキー設定後に自動生成されます。',
    };
  },
};

export const mockTts: TtsService = {
  async speak() {
    await delay(200);
    // No audio file in mock; the UI shows a speaker that "plays" silently.
    return { audioUri: '' };
  },
};
