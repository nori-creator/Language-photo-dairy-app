// Supabase Edge Function: "ai"
//
// Holds API keys server-side (never shipped to the client) and exposes:
//   - identify: photo (base64) -> candidate words      [Google Gemini]
//   - enrich:   word           -> full dictionary back  [Google Gemini]
//   - cutout:   photo (base64) -> background-removed PNG [remove.bg]
//
// deno-lint-ignore-file no-explicit-any

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
// gemini-2.5-flash-lite has the largest free-tier quota and is multimodal.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
const REMOVEBG_API_KEY = Deno.env.get('REMOVEBG_API_KEY') ?? '';

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

/** Strip ```json fences and parse, tolerating extra prose around the JSON. */
function parseJson(text: string): any {
  let t = text.trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const match = t.match(/[[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Could not parse JSON from model: ${text.slice(0, 200)}`);
  }
}

/** Call Gemini generateContent. No responseSchema (fragile across models) —
 *  we ask for JSON via responseMimeType + prompt and parse defensively.
 *  `model` can be overridden per request (used to find one with free quota). */
async function callGemini(parts: any[], model = GEMINI_MODEL): Promise<any> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error(`Gemini ${res.status} (model=${GEMINI_MODEL}): ${raw}`);
    throw new Error(`Gemini ${res.status}: ${raw.slice(0, 300)}`);
  }
  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error(`Gemini empty response: ${raw.slice(0, 300)}`);
    throw new Error('Gemini returned no text');
  }
  return parseJson(text);
}

async function identify(body: any) {
  const { imageBase64, mode } = body;
  if (!imageBase64) return json({ error: 'imageBase64 required' }, 400);

  const objectPrompt =
    `You are a Traditional Chinese (Taiwan Mandarin, 台灣華語) vocabulary assistant for a ` +
    `Japanese learner. Look at the photo and identify the most prominent, learnable objects. ` +
    `Respond with ONLY a JSON array of up to 5 candidate objects, ordered by confidence descending. ` +
    `Each object has exactly these keys: ` +
    `"word" (the everyday term in TRADITIONAL CHINESE characters as used in TAIWAN — NEVER Japanese, ` +
    `NEVER Simplified Chinese, NEVER English/romanization), ` +
    `"reading" (Zhuyin / 注音符號 with tone marks, e.g. "ㄅㄧˇ"), ` +
    `"nativeTranslation" (in Japanese), ` +
    `"emoji" (one representative emoji), ` +
    `"categoryId" (one of: ${CATEGORY_IDS.join(', ')}; use "object" if unsure), ` +
    `"confidence" (number 0..1). ` +
    `Output strictly Taiwan Mandarin — do NOT output Japanese words or kana readings. No markdown, no extra text.`;

  const ocrPrompt =
    `You are a Taiwan Mandarin (台灣華語) reading assistant for a Japanese learner. Read the ` +
    `Traditional Chinese text visible in this photo (sign/menu/book/label) and extract up to 6 USEFUL ` +
    `vocabulary words or short phrases a learner would save. Respond with ONLY a JSON array, ordered by usefulness. ` +
    `Each item has exactly these keys: ` +
    `"word" (the word/phrase exactly as written, TRADITIONAL CHINESE as used in TAIWAN — never Simplified, never Japanese), ` +
    `"reading" (Zhuyin / 注音符號 with tone marks), "nativeTranslation" (in Japanese), ` +
    `"emoji" (one representative emoji), "categoryId" (one of: ${CATEGORY_IDS.join(', ')}; use "sign" for signage else best fit), ` +
    `"confidence" (number 0..1). Ignore English, numbers, prices, and pure punctuation. No markdown, no extra text.`;

  const candidates = await callGemini(
    [{ text: mode === 'ocr' ? ocrPrompt : objectPrompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }],
    body.model,
  );
  return json({ candidates: Array.isArray(candidates) ? candidates : [] });
}

async function enrich(body: any) {
  const { word, target, native } = body;
  if (!word) return json({ error: 'word required' }, 400);

  const prompt =
    `You are a professional Taiwan Mandarin (台灣華語) lexicographer. Build an ACCURATE vocabulary ` +
    `flash-card for the word "${word}". Every field must be linguistically correct and natural to ` +
    `native Taiwanese speakers (台灣教育部 usage); example sentences must be natural daily Taiwan usage, ` +
    `grammatical, and actually contain the word. ` +
    `Treat it strictly as Taiwan Mandarin — NEVER as Japanese, NEVER Simplified Chinese. ` +
    `All Chinese text MUST be Traditional characters as used in Taiwan. Write all explanations in Japanese. ` +
    `Respond with ONLY a JSON object with these keys: ` +
    `"reading" (Zhuyin / 注音符號 with tone marks, e.g. "ㄅㄧˇ" — NOT pinyin, NOT kana), ` +
    `"ipa" (empty string ""), ` +
    `"meaning" (in Japanese), ` +
    `"partOfSpeech" (in Japanese, e.g. 名詞/動詞/形容詞), ` +
    `"level" (TOCFL level per Taiwan 教育部・華語文能力測驗; one of: 準備級, 入門級, 基礎級, 進階級, 高階級, 流利級), ` +
    `"examples" (array of {"text","translation"}; text in Traditional Chinese as used in Taiwan, ` +
    `translation in Japanese; give 2), "collocations" (array of Traditional Chinese strings), ` +
    `"synonyms" (array, Traditional Chinese), "antonyms" (array, Traditional Chinese), ` +
    `"etymology" (string in Japanese), "note" (one memorable line in Japanese). ` +
    `Use empty arrays/strings when not applicable. No markdown, no extra text.`;

  const fields = await callGemini([{ text: prompt }], body.model);
  return json({ fields });
}

async function tts(body: any) {
  const { text } = body;
  if (!text) return json({ error: 'text required' }, 400);
  // Google Translate TTS with tl=zh-TW yields a natural Taiwan Mandarin voice.
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`tts ${res.status}: ${detail.slice(0, 120)}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return json({ audioBase64: btoa(binary), mime: 'audio/mpeg' });
}

async function cutout(body: any) {
  const { imageBase64 } = body;
  if (!imageBase64) return json({ error: 'imageBase64 required' }, 400);
  if (!REMOVEBG_API_KEY) return json({ error: 'REMOVEBG_API_KEY not set' }, 501);

  const form = new FormData();
  form.append('image_file_b64', imageBase64);
  form.append('size', 'auto');
  form.append('format', 'png');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVEBG_API_KEY },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(`remove.bg ${res.status}: ${detail}`);
    throw new Error(`remove.bg ${res.status}: ${detail.slice(0, 200)}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  // Base64-encode the PNG bytes.
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const pngBase64 = btoa(binary);
  return json({ pngBase64 });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    switch (body.action) {
      case 'identify':
        if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY not set' }, 500);
        return await identify(body);
      case 'enrich':
        if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY not set' }, 500);
        return await enrich(body);
      case 'tts':
        return await tts(body);
      case 'cutout':
        return await cutout(body);
      default:
        return json({ error: 'unknown action' }, 400);
    }
  } catch (e) {
    console.error('Function error:', String(e));
    return json({ error: String(e) }, 500);
  }
});
