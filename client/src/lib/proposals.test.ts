import { describe, expect, it } from 'vitest';
import type { Proposal } from '../api/types';
import { isStale, orderedSides, responseLabel, sinceLabel } from './proposals';

const DAY = 86_400_000;
const NOW = Date.parse('2026-10-02T12:00:00Z');

const proposal = (overrides: Partial<Proposal> = {}): Proposal => ({
  _id: 'p1',
  sides: [
    { single: { _id: 'b', firstName: 'נועה', gender: 'נקבה', sector: 'דתי/ה לאומי/ת', birthYear: 1998, city: 'ירושלים', mine: true }, response: 'pending' },
    { single: { _id: 'a', firstName: 'אביתר', gender: 'זכר', sector: 'דתי/ה לאומי/ת', birthYear: 1995, city: 'מודיעין', mine: true }, response: 'yes' },
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
});
