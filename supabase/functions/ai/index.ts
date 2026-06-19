// Supabase Edge Function: "ai"
//
// Holds the Google AI Studio (Gemini) API key as a server-side secret and
// exposes two actions to the app so the key is NEVER shipped in the client:
//   - identify: photo (base64) -> candidate words
//   - enrich:   word           -> full dictionary card back
//
// Deploy:   supabase functions deploy ai --no-verify-jwt
// Secret:   supabase secrets set GEMINI_API_KEY=your_new_key
//
// deno-lint-ignore-file no-explicit-any

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CATEGORY_IDS = ['fruit', 'animal', 'food', 'sign', 'object'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Call Gemini generateContent and return the parsed JSON payload. */
async function callGemini(parts: any[], responseSchema: any) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'null';
  return JSON.parse(text);
}

async function identify(body: any) {
  const { imageBase64, target, native } = body;
  if (!imageBase64) return json({ error: 'imageBase64 required' }, 400);

  const prompt =
    `You are a language-learning assistant. Look at the photo and identify the single most ` +
    `prominent, learnable object. Propose up to 3 candidate words in the target language ` +
    `"${target}" with a translation in the learner's native language "${native}". ` +
    `Pick categoryId from this list only: ${CATEGORY_IDS.join(', ')} (use "object" if unsure). ` +
    `"reading" is pinyin/kana/romanization. "emoji" is one emoji that best represents it. ` +
    `confidence is 0..1. Order by confidence descending.`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        word: { type: 'STRING' },
        reading: { type: 'STRING' },
        nativeTranslation: { type: 'STRING' },
        emoji: { type: 'STRING' },
        categoryId: { type: 'STRING' },
        confidence: { type: 'NUMBER' },
      },
      required: ['word', 'reading', 'nativeTranslation', 'emoji', 'categoryId', 'confidence'],
    },
  };

  const candidates = await callGemini(
    [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }],
    schema,
  );
  return json({ candidates });
}

async function enrich(body: any) {
  const { word, target, native } = body;
  if (!word) return json({ error: 'word required' }, 400);

  const prompt =
    `Build a vocabulary flash-card back for the word "${word}" in language "${target}", ` +
    `with all explanations written in the learner's native language "${native}". ` +
    `Dictionary fields (meaning, partOfSpeech, ipa, level, reading) must be accurate. ` +
    `level is a CEFR/HSK-style label. Provide 2 natural example sentences (text in ${target}, ` +
    `translation in ${native}), common collocations, synonyms, antonyms, a short etymology, ` +
    `and one memorable note. Use empty arrays/strings when not applicable.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      reading: { type: 'STRING' },
      ipa: { type: 'STRING' },
      meaning: { type: 'STRING' },
      partOfSpeech: { type: 'STRING' },
      level: { type: 'STRING' },
      examples: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { text: { type: 'STRING' }, translation: { type: 'STRING' } },
          required: ['text', 'translation'],
        },
      },
      collocations: { type: 'ARRAY', items: { type: 'STRING' } },
      synonyms: { type: 'ARRAY', items: { type: 'STRING' } },
      antonyms: { type: 'ARRAY', items: { type: 'STRING' } },
      etymology: { type: 'STRING' },
      note: { type: 'STRING' },
    },
    required: ['reading', 'ipa', 'meaning', 'partOfSpeech', 'level', 'examples'],
  };

  const fields = await callGemini([{ text: prompt }], schema);
  return json({ fields });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY not set on the server' }, 500);

  try {
    const body = await req.json();
    switch (body.action) {
      case 'identify':
        return await identify(body);
      case 'enrich':
        return await enrich(body);
      default:
        return json({ error: 'unknown action' }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
