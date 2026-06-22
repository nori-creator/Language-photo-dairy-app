// Generates the app's tiny UI chimes as 16-bit mono WAVs (no external assets).
// Run: node scripts/gen-sounds.mjs  → writes assets/sounds/*.wav
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
mkdirSync(OUT, { recursive: true });

const clamp = (v) => Math.max(-1, Math.min(1, v));

/** Build a buffer of samples from a list of partials with an ADSR-ish envelope. */
function tone({ dur, partials, attack = 0.005, release = 0.12, drive = 0 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let s = 0;
    for (const [freq, amp, decay = 6] of partials) {
      s += Math.sin(2 * Math.PI * freq * t) * amp * Math.exp(-decay * t);
    }
    if (drive) s = Math.tanh(s * (1 + drive));
    // attack + tail release
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    out[i] = clamp(s * env);
  }
  return out;
}

/** Soft filtered-noise click (camera shutter). */
function click({ dur = 0.06 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const white = Math.random() * 2 - 1;
    last = last * 0.6 + white * 0.4; // low-pass → softer
    out[i] = clamp(last * Math.exp(-38 * t));
  }
  return out;
}

function concat(...buffers) {
  const total = buffers.reduce((a, b) => a + b.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const b of buffers) { out.set(b, o); o += b.length; }
  return out;
}

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE((clamp(samples[i]) * 32767) | 0, i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);          // PCM
  header.writeUInt16LE(1, 22);          // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const sounds = {
  // Crisp, quiet shutter.
  shutter: click({ dur: 0.07 }),
  // Soft rising sine as the subject "lifts" off the background.
  lift: tone({ dur: 0.28, attack: 0.02, release: 0.16, partials: [[520, 0.5, 3], [780, 0.18, 4]] }),
  // Two-note major-third chime as the sticker settles into the card.
  success: concat(
    tone({ dur: 0.16, release: 0.1, partials: [[784, 0.5, 5], [1568, 0.12, 7]] }),
    tone({ dur: 0.34, release: 0.22, partials: [[1046, 0.5, 4], [2092, 0.12, 6]] }),
  ),
  // Tiny tick for selection.
  tap: tone({ dur: 0.05, attack: 0.002, release: 0.03, partials: [[1200, 0.4, 30]] }),
};

for (const [name, samples] of Object.entries(sounds)) {
  const file = join(OUT, `${name}.wav`);
  writeFileSync(file, toWav(samples));
  console.log('wrote', file, `(${(samples.length / RATE).toFixed(2)}s)`);
}
