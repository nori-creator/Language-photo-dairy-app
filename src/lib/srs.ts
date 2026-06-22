import { SrsState } from '@/types';

/** Quality of a recall attempt, mapped from the review UI. */
export type Recall = 'forgot' | 'hard' | 'good' | 'easy';

const QUALITY: Record<Recall, number> = {
  forgot: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export function initialSrs(now: Date = new Date()): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now.toISOString(),
    lapses: 0,
  };
}

/**
 * SM-2 spaced-repetition update. Returns the next SRS state.
 * Kept invisible to the user — the UI only ever shows "still remember?".
 */
export function review(state: SrsState, recall: Recall, now: Date = new Date()): SrsState {
  const q = QUALITY[recall];
  let { ease, intervalDays, repetitions, lapses } = state;

  if (q < 3) {
    // Forgot: reset progress and count a lapse (drives photo blur).
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);

    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ease < 1.3) ease = 1.3;
  }

  const due = new Date(now);
  due.setDate(due.getDate() + intervalDays);

  return { ease, intervalDays, repetitions, dueAt: due.toISOString(), lapses };
}

/** True when a card is due for review. */
export function isDue(state: SrsState, now: Date = new Date()): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}

/**
 * Forgetting-blur intensity (0 = crisp, 1 = nearly gone).
 * Driven mainly by how long the card is *overdue* — about a week past its
 * review date fades it heavily — plus extra fade for repeated lapses. Recalling
 * it (which pushes dueAt into the future) instantly restores sharpness. This
 * powers the loss-aversion mechanic. Capped below 1 so a silhouette remains.
 */
export function blurAmount(state: SrsState): number {
  const overdueDays = Math.max(0, (Date.now() - new Date(state.dueAt).getTime()) / 86_400_000);
  const fromOverdue = Math.min(0.8, (overdueDays / 7) * 0.8); // ~0.8 after 1 week overdue
  const fromLapses = Math.min(0.4, state.lapses * 0.15);
  return Math.min(0.9, fromOverdue + fromLapses);
}
