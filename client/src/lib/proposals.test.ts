import { describe, expect, it } from 'vitest';
import type { Proposal } from '../api/types';
import { dateInDays, holdState, isStale, orderedSides, responseLabel, sinceLabel, untilLabel } from './proposals';

const DAY = 86_400_000;
const NOW = Date.parse('2026-10-02T12:00:00Z');

const proposal = (overrides: Partial<Proposal> = {}): Proposal => ({
  _id: 'p1',
  sides: [
    { single: { _id: 'b', firstName: 'נועה', gender: 'נקבה', sectors: ['דתי/ה לאומי/ת'], age: 28, city: 'ירושלים', mine: true }, response: 'pending' },
    { single: { _id: 'a', firstName: 'אביתר', gender: 'זכר', sectors: ['דתי/ה לאומי/ת'], age: 31, city: 'מודיעין', mine: true }, response: 'yes' },
  ],
  status: 'proposed',
  datesCount: 0,
  history: [{ status: 'proposed', at: new Date(NOW - 8 * DAY).toISOString() }],
  createdAt: new Date(NOW - 9 * DAY).toISOString(),
  updatedAt: new Date(NOW - 8 * DAY).toISOString(),
  ...overrides,
});

describe('proposal helpers', () => {
  it('puts the man first', () => {
    expect(orderedSides(proposal()).map((s) => s.single?.firstName)).toEqual(['אביתר', 'נועה']);
  });

  it('flags open proposals with no activity for a week', () => {
    expect(isStale(proposal(), NOW)).toBe(true);
    expect(isStale(proposal({ status: 'married' }), NOW)).toBe(false);
    expect(isStale(proposal({ history: [{ status: 'proposed', at: new Date(NOW - DAY).toISOString() }] }), NOW)).toBe(false);
  });

  it('labels responses by gender and dates relatively', () => {
    expect(responseLabel('yes', 'נקבה')).toBe('מעוניינת');
    expect(responseLabel('no', 'זכר')).toBe('לא מעוניין');
    expect(sinceLabel(new Date(NOW).toISOString(), NOW)).toBe('היום');
    expect(sinceLabel(new Date(NOW - 3 * DAY).toISOString(), NOW)).toBe('לפני 3 ימים');
  });

  it('tracks a hold: waiting, then due once the date passes', () => {
    const hold = { until: new Date(NOW + 3 * DAY).toISOString(), since: new Date(NOW).toISOString(), unavailable: ['b'] };
    expect(holdState(proposal(), NOW)).toBe('none');
    expect(holdState(proposal({ hold }), NOW)).toBe('waiting');
    expect(holdState(proposal({ hold }), NOW + 4 * DAY)).toBe('due');
    // A closed proposal is never on hold, whatever is stored
    expect(holdState(proposal({ hold, status: 'closed' }), NOW)).toBe('none');
    // Waiting on hold isn't "stale", but a due one is a follow-up of its own
    expect(isStale(proposal({ hold }), NOW)).toBe(false);
    expect(untilLabel(hold.until, NOW)).toBe('עוד 3 ימים');
    expect(untilLabel(new Date(NOW + DAY).toISOString(), NOW)).toBe('מחר');
  });

  it('dateInDays gives a local YYYY-MM-DD', () => {
    expect(dateInDays(7, new Date(2026, 9, 28))).toBe('2026-11-04');
  });
});
