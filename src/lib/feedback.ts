import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Unified sensory feedback: every call fires sound + haptic together so the
 * capture/reward moments feel "音・触覚・視覚" in sync. Sounds are tiny bundled
 * chimes (see scripts/gen-sounds.mjs). Audio is polite — it respects the iOS
 * silent switch and mixes with other audio, and every call is failure-safe.
 */
const sources = {
  shutter: require('../../assets/sounds/shutter.wav'),
  lift: require('../../assets/sounds/lift.wav'),
  success: require('../../assets/sounds/success.wav'),
  tap: require('../../assets/sounds/tap.wav'),
} as const;

type SoundName = keyof typeof sources;

let players: Partial<Record<SoundName, AudioPlayer>> = {};
let muted = false;

try {
  // playsInSilentMode so tapped pronunciation is always audible.
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  for (const name of Object.keys(sources) as SoundName[]) {
    players[name] = createAudioPlayer(sources[name]);
    players[name]!.volume = 0.7;
  }
} catch {
  players = {};
}

export function setMuted(v: boolean) {
  muted = v;
}

function play(name: SoundName) {
  if (muted) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    /* audio unavailable — haptics still fire */
  }
}

export const feedback = {
  /** Selection tick — list/candidate taps. */
  tap() {
    Haptics.selectionAsync().catch(() => {});
    play('tap');
  },
  /** Shutter — the moment a photo is taken. */
  capture() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    play('shutter');
  },
  /** The subject lifting off into a sticker. */
  lift() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    play('lift');
  },
  /** The sticker settling into the collection — the reward beat. */
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    play('success');
  },
};
