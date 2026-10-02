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

/**
 * 'waiting': on hold and the date hasn't come yet; 'due': the hold date has
 * passed and it's time to get back to it; 'none': not on hold.
 */
export function holdState(p: Proposal, now = Date.now()): 'none' | 'waiting' | 'due' {
  if (!p.hold || !OPEN.includes(p.status)) return 'none';
  return new Date(p.hold.until).getTime() > now ? 'waiting' : 'due';
}

/** An open proposal with no change for this many days is flagged for follow-up (unless it's waiting on hold). */
export const STALE_DAYS = 7;
export const isStale = (p: Proposal, now = Date.now()) =>
  OPEN.includes(p.status) && holdState(p, now) === 'none' && daysSince(lastActivity(p), now) >= STALE_DAYS;

/** Quick picks for how long to put a proposal on hold. */
export const HOLD_PERIODS = [
  { label: 'שבוע', days: 7 },
  { label: 'שבועיים', days: 14 },
  { label: 'חודש', days: 30 },
  { label: '3 חודשים', days: 90 },
  { label: 'חצי שנה', days: 182 },
] as const;

/** YYYY-MM-DD `days` from now, in local time (what <input type="date"> holds). */
export function dateInDays(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "עוד 5 ימים" / "מחר" / "היום" until the hold ends. */
export function untilLabel(iso: string, now = Date.now()) {
  // Calendar days, so a hold until the end of a day two weeks out reads "14 days"
  const day = (t: number) => {
    const d = new Date(t);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  const d = Math.round((day(new Date(iso).getTime()) - day(now)) / 86_400_000);
  if (d <= 0) return 'היום';
  if (d === 1) return 'מחר';
  if (d < 30) return `עוד ${d} ימים`;
  const m = Math.round(d / 30);
  return m === 1 ? 'עוד חודש' : `עוד ${m} חודשים`;
}
