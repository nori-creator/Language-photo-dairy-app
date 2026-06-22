/** YYYY-MM-DD for a given date in local time. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function diffDays(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Duolingo-style streak update. Returns the new streak count given the
 * previous streak, the last active day, and today.
 */
export function updateStreak(streak: number, lastActive: string, today: string = dayKey()): number {
  if (!lastActive) return 1;
  const gap = diffDays(lastActive, today);
  if (gap <= 0) return Math.max(streak, 1); // same day
  if (gap === 1) return streak + 1; // consecutive day
  return 1; // streak broken
}

/**
 * Next reminder time: Duolingo learns the hour you studied yesterday and
 * nudges you at the same hour the next day. Returns a Date or null.
 */
export function nextReminder(habitHour: number | null, from: Date = new Date()): Date | null {
  if (habitHour == null) return null;
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  next.setHours(habitHour, 0, 0, 0);
  return next;
}
