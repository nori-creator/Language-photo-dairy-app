import { Profile } from '@/types';

/** Daily capture limits per plan. Free users are nudged to upgrade. */
export const DAILY_LIMIT: Record<Profile['plan'], number> = {
  free: 5,
  pro: Infinity,
};

export function remainingCaptures(plan: Profile['plan'], capturedToday: number): number {
  return Math.max(0, DAILY_LIMIT[plan] - capturedToday);
}

export function canCapture(plan: Profile['plan'], capturedToday: number): boolean {
  return remainingCaptures(plan, capturedToday) > 0;
}
