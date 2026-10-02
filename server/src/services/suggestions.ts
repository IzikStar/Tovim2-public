import { Types } from 'mongoose';
import { Single, ISingle } from '../models/single.js';
import { Proposal } from '../models/proposal.js';

/** Fields the matching needs; images are left out because they are large. */
const MATCH_FIELDS =
  'firstName lastName gender sector birthYear city marriageStatus numOfChildren interests desiredSectors desiredAgeRange matchMakers isPublic currentOccupation';

type Candidate = Pick<
  ISingle,
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'sector'
  | 'birthYear'
  | 'city'
  | 'marriageStatus'
  | 'numOfChildren'
  | 'interests'
  | 'desiredSectors'
  | 'desiredAgeRange'
  | 'matchMakers'
  | 'isPublic'
  | 'currentOccupation'
> & { _id: Types.ObjectId };

export interface SuggestionPerson {
  _id: string;
  firstName: string;
  /** Only for singles the matchmaker handles; pool singles stay anonymous */
  lastName?: string;
  gender: string;
  sector: string;
  age: number;
  city: string;
  currentOccupation?: string;
  mine: boolean;
}

export interface Suggestion {
  single: SuggestionPerson;
  candidate: SuggestionPerson;
  score: number;
  reasons: string[];
}

const age = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear;

const inRange = (value: number, range?: { min?: number; max?: number } | null) =>
  !range || ((range.min == null || value >= range.min) && (range.max == null || value <= range.max));

const wantsSector = (who: Candidate, sector: string) =>
  !who.desiredSectors?.length || who.desiredSectors.includes(sector as any);

/**
 * Scores a pair 0-100, or returns null when one side's stated requirements
 * (gender, desired sectors, desired age range) rule the other out.
 */
export const scorePair = (a: Candidate, b: Candidate): { score: number; reasons: string[] } | null => {
  if (a.gender === b.gender) return null;
  const ageA = age(a.birthYear);
  const ageB = age(b.birthYear);
  if (!wantsSector(a, b.sector) || !wantsSector(b, a.sector)) return null;
  if (!inRange(ageB, a.desiredAgeRange) || !inRange(ageA, b.desiredAgeRange)) return null;

  let score = 40;
  const reasons: string[] = [];

  if (a.desiredSectors?.length && b.desiredSectors?.length) {
    score += 15;
    reasons.push('המגזר מתאים לשני הצדדים');
  } else {
    score += 5;
  }
  if (a.sector === b.sector) {
    score += 10;
    reasons.push(`שניהם ${a.sector}`);
  }
  if (a.desiredAgeRange || b.desiredAgeRange) {
    score += 10;
    reasons.push('הגילאים בטווח המבוקש');
  }
  const gap = Math.abs(ageA - ageB);
  if (gap <= 3) score += 5;

  const shared = (a.interests ?? []).filter((i) => (b.interests ?? []).includes(i));
  if (shared.length) {
    score += Math.min(shared.length, 3) * 5;
    reasons.push(`תחומי עניין משותפים: ${shared.slice(0, 3).join(', ')}`);
  }
  if (a.city && a.city === b.city) {
    score += 5;
    reasons.push(`שניהם מ${a.city}`);
  }
  if (a.marriageStatus === b.marriageStatus) {
    score += 5;
  }
  return { score: Math.min(score, 100), reasons };
};

const person = (s: Candidate, matchMakerId: string): SuggestionPerson => {
  const mine = s.matchMakers.some((id) => id.toString() === matchMakerId);
  return {
    _id: s._id.toString(),
    firstName: s.firstName,
    ...(mine ? { lastName: s.lastName } : {}),
    gender: s.gender,
    sector: s.sector,
    age: age(s.birthYear),
    city: s.city,
    currentOccupation: s.currentOccupation,
    mine,
  };
};

/**
 * Pairs one of the matchmaker's singles with another of theirs or with a
 * single from the shared pool. Skips taken singles and any pair the
 * matchmaker already has a proposal for (in any status, so a rejected match
 * isn't suggested again).
 */
export const suggestMatches = async (
  matchMakerId: string,
  { limit = 12, perSingle = 3, singleId }: { limit?: number; perSingle?: number; singleId?: string } = {}
): Promise<Suggestion[]> => {
  const notTaken = { isTaken: { $ne: true } };
  const [mine, pool, proposals] = await Promise.all([
    Single.find({ ...notTaken, matchMakers: matchMakerId }, MATCH_FIELDS).lean<Candidate[]>(),
    Single.find({ ...notTaken, isPublic: true, matchMakers: { $ne: matchMakerId } }, MATCH_FIELDS).lean<Candidate[]>(),
    Proposal.find({ matchMaker: matchMakerId }, 'sides.single').lean(),
  ]);

  const pairKey = (x: string, y: string) => (x < y ? `${x}:${y}` : `${y}:${x}`);
  const known = new Set(
    proposals.map((p) => pairKey(p.sides[0].single.toString(), p.sides[1].single.toString()))
  );

  const sources = singleId ? mine.filter((s) => s._id.toString() === singleId) : mine;
  const candidates = [...mine, ...pool];
  const seen = new Set<string>();
  const result: Suggestion[] = [];

  for (const s of sources) {
    const scored: Suggestion[] = [];
    for (const c of candidates) {
      const key = pairKey(s._id.toString(), c._id.toString());
      if (s._id.equals(c._id) || known.has(key) || seen.has(key)) continue;
      const match = scorePair(s, c);
      if (!match) continue;
      scored.push({ single: person(s, matchMakerId), candidate: person(c, matchMakerId), ...match });
    }
    scored.sort((x, y) => y.score - x.score);
    for (const sug of scored.slice(0, perSingle)) {
      seen.add(pairKey(sug.single._id, sug.candidate._id));
      result.push(sug);
    }
  }
  result.sort((x, y) => y.score - x.score);
  return result.slice(0, limit);
};
