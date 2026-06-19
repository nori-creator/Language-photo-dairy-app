import { Profile, VocabCard } from '@/types';
import { initialSrs } from '@/lib/srs';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/** A few pre-collected cards so the Dex / Diary / Review screens have content. */
export const SEED_CARDS: VocabCard[] = [
  {
    id: 'c1', sticker: '🍎', photo: '🍎', targetLanguage: 'zh-TW',
    word: '蘋果', reading: 'píngguǒ', ipa: '/pʰǐŋ.kwò/', meaning: 'りんご（果物）',
    partOfSpeech: '名詞', level: 'HSK 1',
    examples: [
      { text: '我每天吃一個蘋果。', translation: '私は毎日りんごを1つ食べます。' },
      { text: '這個蘋果很甜。', translation: 'このりんごはとても甘いです。' },
    ],
    collocations: ['紅蘋果（赤いりんご）'], synonyms: [], antonyms: [],
    etymology: '「蘋」＋「果」。', note: '台湾の市場で最もよく見る果物のひとつ。',
    audioUri: null, categoryId: 'fruit',
    srs: { ...initialSrs(), repetitions: 2, intervalDays: 6, dueAt: daysAgo(-1), lapses: 0 },
    capturedAt: daysAgo(2),
    location: { latitude: 25.033, longitude: 121.5654, name: '台北・永康街' },
  },
  {
    id: 'c2', sticker: '🐶', photo: '🐶', targetLanguage: 'zh-TW',
    word: '狗', reading: 'gǒu', ipa: '/kòʊ/', meaning: 'いぬ',
    partOfSpeech: '名詞', level: 'HSK 1',
    examples: [{ text: '那隻狗很可愛。', translation: 'あの犬はとても可愛い。' }],
    collocations: ['小狗（子犬）'], synonyms: ['犬'], antonyms: ['貓（ねこ）'],
    etymology: '象形に由来する基本語。', note: '量詞は「隻 (zhī)」。',
    audioUri: null, categoryId: 'animal',
    srs: { ...initialSrs(), repetitions: 0, dueAt: daysAgo(1), lapses: 2 },
    capturedAt: daysAgo(2),
    location: { latitude: 25.041, longitude: 121.543, name: '大安森林公園' },
  },
  {
    id: 'c3', sticker: '☕', photo: '☕', targetLanguage: 'zh-TW',
    word: '咖啡', reading: 'kāfēi', ipa: '/kʰá.feɪ/', meaning: 'コーヒー',
    partOfSpeech: '名詞', level: 'HSK 1',
    examples: [{ text: '我想喝一杯咖啡。', translation: 'コーヒーを1杯飲みたいです。' }],
    collocations: ['一杯咖啡（コーヒー1杯）'], synonyms: [], antonyms: [],
    etymology: '英語 "coffee" の音訳。', note: '量詞は「杯 (bēi)」。',
    audioUri: null, categoryId: 'food',
    srs: { ...initialSrs(), repetitions: 1, intervalDays: 1, dueAt: daysAgo(0), lapses: 0 },
    capturedAt: daysAgo(0),
    location: { latitude: 25.045, longitude: 121.532, name: '西門町のカフェ' },
  },
];

export const DEFAULT_PROFILE: Profile = {
  nativeLanguage: 'ja',
  targetLanguage: 'zh-TW',
  plan: 'free',
  streak: 3,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  habitHour: 20,
  goal: { name: 'TOCFL Band A', requiredWords: 500 },
};
