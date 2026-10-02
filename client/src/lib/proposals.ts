import type { Gender, Proposal, ProposalPerson, ProposalStatus, SideResponse } from '../api/types';

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  idea: 'רעיון',
  proposed: 'הוצע',
  dating: 'נפגשים',
  engaged: 'מאורסים',
  married: 'התחתנו',
  closed: 'נסגר',
};

export const STATUS_TONE: Record<ProposalStatus, 'neutral' | 'accent' | 'ok' | 'warn' | 'bad'> = {
  idea: 'neutral',
  proposed: 'warn',
  dating: 'accent',
  engaged: 'ok',
  married: 'ok',
  closed: 'bad',
};

/** The board columns, in the order a match moves through them. */
export const BOARD: ProposalStatus[] = ['idea', 'proposed', 'dating', 'engaged', 'married', 'closed'];

export const OPEN: ProposalStatus[] = ['idea', 'proposed', 'dating', 'engaged'];

const RESPONSE_LABEL: Record<SideResponse, [male: string, female: string]> = {
  pending: ['עוד לא ענה', 'עוד לא ענתה'],
  thinking: ['חושב', 'חושבת'],
  yes: ['מעוניין', 'מעוניינת'],
  no: ['לא מעוניין', 'לא מעוניינת'],
};

export const responseLabel = (response: SideResponse, gender?: Gender) =>
  RESPONSE_LABEL[response][gender === 'נקבה' ? 1 : 0];

export const RESPONSE_TONE: Record<SideResponse, 'neutral' | 'ok' | 'warn' | 'bad'> = {
  pending: 'neutral',
  thinking: 'warn',
  yes: 'ok',
  no: 'bad',
};

export const personName = (p: Pick<ProposalPerson, 'firstName' | 'lastName'> | null) =>
  p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : 'מועמד/ת שנמחק/ה';

/** Him first, then her, so cards read the same way everywhere. */
export const orderedSides = (p: Proposal) =>
  [...p.sides].sort((a, b) => (a.single?.gender === 'זכר' ? -1 : 0) - (b.single?.gender === 'זכר' ? -1 : 0));

export const lastActivity = (p: Proposal) => p.history[p.history.length - 1]?.at ?? p.updatedAt;

export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);

export const sinceLabel = (iso: string, now = Date.now()) => {
  const d = daysSince(iso, now);
  if (d <= 0) return 'היום';
  if (d === 1) return 'אתמול';
  if (d < 30) return `לפני ${d} ימים`;
  const m = Math.floor(d / 30);
  return m === 1 ? 'לפני חודש' : `לפני ${m} חודשים`;
};

/** An open proposal with no change for this many days is flagged for follow-up. */
export const STALE_DAYS = 7;
export const isStale = (p: Proposal, now = Date.now()) =>
  OPEN.includes(p.status) && daysSince(lastActivity(p), now) >= STALE_DAYS;
