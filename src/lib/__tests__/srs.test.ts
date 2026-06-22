import { blurAmount, initialSrs, isDue, review } from '../srs';
import { updateStreak } from '../streak';
import { canCapture, remainingCaptures } from '../quota';

describe('SRS (SM-2)', () => {
  it('schedules a new card as due immediately', () => {
    expect(isDue(initialSrs(), new Date())).toBe(true);
  });

  it('advances interval on successful recalls', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    let s = initialSrs(now);
    s = review(s, 'good', now);
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    s = review(s, 'good', now);
    expect(s.repetitions).toBe(2);
    expect(s.intervalDays).toBe(6);
  });

  it('resets and records a lapse when forgotten', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    let s = review(review(initialSrs(now), 'good', now), 'good', now);
    s = review(s, 'forgot', now);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.lapses).toBe(1);
  });

  it('increases blur with lapses', () => {
    const base = initialSrs(new Date());
    expect(blurAmount(base)).toBeLessThan(blurAmount({ ...base, lapses: 3 }));
  });
});

describe('streak', () => {
  it('increments on consecutive days and resets after a gap', () => {
    expect(updateStreak(3, '2026-01-01', '2026-01-02')).toBe(4);
    expect(updateStreak(3, '2026-01-01', '2026-01-05')).toBe(1);
    expect(updateStreak(3, '2026-01-01', '2026-01-01')).toBe(3);
  });
});

describe('quota', () => {
  it('limits free users and is unlimited for pro', () => {
    expect(remainingCaptures('free', 5)).toBe(0);
    expect(canCapture('free', 5)).toBe(false);
    expect(canCapture('pro', 999)).toBe(true);
  });
});
