import { Types } from 'mongoose';
import { Single, ISingle } from '../models/single.js';
import { Proposal } from '../models/proposal.js';
import { ageOn } from '../utils/age.js';

/** Fields the matching needs; images are left out because they are large. */
export const MATCH_FIELDS =
  'firstName lastName gender sectors birthDate city marriageStatus numOfChildren interests desiredSectors desiredAgeRange matchMakers isPublic currentOccupation createdAt';

export type Candidate = Pick<
  ISingle,
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'sectors'
  | 'birthDate'
  | 'city'
  | 'marriageStatus'
  | 'numOfChildren'
  | 'interests'
  | 'desiredSectors'
  | 'desiredAgeRange'
  | 'matchMakers'
  | 'isPublic'
  | 'currentOccupation'
> & { _id: Types.ObjectId; createdAt?: Date };

export interface SuggestionPerson {
  _id: string;
  firstName: string;
  /** Only for singles the matchmaker handles; pool singles stay anonymous */
  lastName?: string;
  gender: string;
  sectors: string[];
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


const inRange = (value: number, range?: { min?: number; max?: number } | null) =>
  !range || ((range.min == null || value >= range.min) && (range.max == null || value <= range.max));

/** No stated preference, or at least one of the other's sectors is wanted. */
const wantsSectors = (who: Candidate, sectors: string[]) =>
  !who.desiredSectors?.length || sectors.some((s) => who.desiredSectors.includes(s as any));

/**
 * The stated requirements (desired sectors, desired age range) each side of
 * an opposite-gender pair doesn't meet, in Hebrew; empty when the pair fits.
 */
export const missedRequirements = (a: Candidate, b: Candidate): string[] => {
  const misses: string[] = [];
  const ageA = ageOn(a.birthDate);
  const ageB = ageOn(b.birthDate);
  for (const [who, other, otherAge] of [[a, b, ageB], [b, a, ageA]] as const) {
    if (!wantsSectors(who, other.sectors ?? [])) misses.push(`${who.firstName} ביקש/ה מגזר אחר`);
    if (!inRange(otherAge, who.desiredAgeRange)) misses.push(`${other.firstName} מחוץ לטווח הגילאים של ${who.firstName}`);
  }
  return misses;
};

/**
 * Scores a pair 0-100, or returns null when one side's stated requirements
 * (gender, desired sectors, desired age range) rule the other out.
 */
export const scorePair = (a: Candidate, b: Candidate): { score: number; reasons: string[] } | null => {
  if (a.gender === b.gender || missedRequirements(a, b).length) return null;
  return scoreTraits(a, b);
};

/** The score ignoring the sector and age requirements (gender still has to differ). */
export const scoreTraits = (a: Candidate, b: Candidate): { score: number; reasons: string[] } => {
  const ageA = ageOn(a.birthDate);
  const ageB = ageOn(b.birthDate);
  const fits = missedRequirements(a, b).length === 0;

  let score = 40;
  const reasons: string[] = [];

  if (!fits) {
    // Requirements were not met, so none of the "fits what they asked" points
  } else if (a.desiredSectors?.length && b.desiredSectors?.length) {
    score += 15;
    reasons.push('המגזר מתאים לשני הצדדים');
  } else {
    score += 5;
  }
  if ((a.sectors ?? []).some((x) => (b.sectors ?? []).includes(x))) {
    score += 10;
    reasons.push('מגזר משותף');
  }
  if (fits && (a.desiredAgeRange || b.desiredAgeRange)) {
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

export const person = (s: Candidate, matchMakerId: string): SuggestionPerson => {
  const mine = s.matchMakers.some((id) => id.toString() === matchMakerId);
  return {
    _id: s._id.toString(),
    firstName: s.firstName,
    ...(mine ? { lastName: s.lastName } : {}),
    gender: s.gender,
    sectors: s.sectors ?? [],
    age: ageOn(s.birthDate),
    city: s.city,
    currentOccupation: s.currentOccupation,
    mine,
  };
};

export const pairKey = (x: string, y: string) => (x < y ? `${x}:${y}` : `${y}:${x}`);

/**
 * The matchmaker's untaken singles, the untaken public pool of the others,
 * and the pairs the matchmaker already has a proposal for (by pairKey).
 */
export const loadMatchContext = async (matchMakerId: string) => {
  const notTaken = { isTaken: { $ne: true } };
  const [mine, pool, proposals] = await Promise.all([
    Single.find({ ...notTaken, matchMakers: matchMakerId }, MATCH_FIELDS).lean<Candidate[]>(),
    Single.find({ ...notTaken, isPublic: true, matchMakers: { $ne: matchMakerId } }, MATCH_FIELDS).lean<Candidate[]>(),
    Proposal.find({ matchMaker: matchMakerId }, 'sides.single status updatedAt').lean(),
  ]);
  const known = new Set(
    proposals.map((p) => pairKey(p.sides[0].single.toString(), p.sides[1].single.toString()))
  );
  return { mine, pool, known, proposals };
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
  const { mine, pool, known } = await loadMatchContext(matchMakerId);

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
