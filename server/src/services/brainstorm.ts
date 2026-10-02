import { OPEN_STATUSES } from '../models/proposal.js';
import {
  Candidate,
  loadMatchContext,
  missedRequirements,
  pairKey,
  person,
  scoreTraits,
  SuggestionPerson,
} from './suggestions.js';

/**
 * Ways to shake up a matchmaker's thinking. Unlike the dashboard
 * suggestions these are not the "best" matches: they are random or
 * deliberately off the usual path, to prompt ideas.
 */
export const BRAINSTORM_MODES = ['random', 'pool', 'waiting', 'outside', 'single'] as const;
export type BrainstormMode = (typeof BRAINSTORM_MODES)[number];

export interface BrainstormIdea {
  single: SuggestionPerson;
  candidate: SuggestionPerson;
  /** Ignores the sector and age requirements (see scoreTraits) */
  score: number;
  reasons: string[];
  /** Requirements this pair doesn't meet; empty when it fits both sides */
  stretches: string[];
  /** Why this pair came up, e.g. how long someone has been waiting */
  note?: string;
}

const DAY = 24 * 60 * 60 * 1000;

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const brainstorm = async (
  matchMakerId: string,
  {
    mode,
    count = 6,
    singleId,
    random = Math.random,
    now = new Date(),
  }: { mode: BrainstormMode; count?: number; singleId?: string; random?: () => number; now?: Date }
): Promise<BrainstormIdea[]> => {
  const { mine, pool, known, proposals } = await loadMatchContext(matchMakerId);
  const everyone = [...mine, ...pool];
  const taken = new Set(known);

  const idea = (a: Candidate, b: Candidate, note?: string): BrainstormIdea => {
    taken.add(pairKey(a._id.toString(), b._id.toString()));
    return {
      single: person(a, matchMakerId),
      candidate: person(b, matchMakerId),
      ...scoreTraits(a, b),
      stretches: missedRequirements(a, b),
      note,
    };
  };
  const open = (a: Candidate, b: Candidate) =>
    a.gender !== b.gender && !a._id.equals(b._id) && !taken.has(pairKey(a._id.toString(), b._id.toString()));

  /** Up to `count` pairs: each source (in order) with the first open partner from `partners(source)`. */
  const pairUp = (
    sources: Candidate[],
    partners: (s: Candidate) => Candidate[],
    note?: (s: Candidate, c: Candidate) => string | undefined,
    perSource = 1
  ) => {
    const out: BrainstormIdea[] = [];
    for (const s of sources) {
      let added = 0;
      for (const c of partners(s)) {
        if (out.length >= count || added >= perSource) break;
        if (!open(s, c)) continue;
        out.push(idea(s, c, note?.(s, c)));
        added++;
      }
      if (out.length >= count) break;
    }
    return out;
  };

  switch (mode) {
    // Any two people, at least one of them the matchmaker's
    case 'random':
      return pairUp(shuffle(mine, random), () => shuffle(everyone, random));

    // One of mine with someone from another matchmaker's public pool
    case 'pool':
      return pairUp(shuffle(mine, random), () => shuffle(pool, random), () => 'מהמאגר המשותף');

    // Whoever has gone longest without an open proposal gets a fresh idea
    case 'waiting': {
      const lastActivity = new Map<string, number>();
      const hasOpen = new Set<string>();
      for (const p of proposals) {
        for (const side of p.sides) {
          const id = side.single.toString();
          lastActivity.set(id, Math.max(lastActivity.get(id) ?? 0, new Date((p as { updatedAt?: Date }).updatedAt ?? 0).getTime()));
          if (OPEN_STATUSES.includes(p.status)) hasOpen.add(id);
        }
      }
      const since = (s: Candidate) => lastActivity.get(s._id.toString()) ?? new Date(s.createdAt ?? now).getTime();
      const waiting = mine.filter((s) => !hasOpen.has(s._id.toString())).sort((x, y) => since(x) - since(y));
      return pairUp(
        waiting,
        (s) => shuffle(everyone, random).sort((x, y) => scoreTraits(s, y).score - scoreTraits(s, x).score),
        (s) => {
          const days = Math.max(0, Math.floor((now.getTime() - since(s)) / DAY));
          const none = !lastActivity.has(s._id.toString());
          return none ? `ל${s.firstName} עוד לא הייתה הצעה (${days} ימים במערכת)` : `${days} ימים בלי הצעה פתוחה ל${s.firstName}`;
        }
      );
    }

    // Pairs that break a stated sector or age requirement but share a lot otherwise
    case 'outside':
      return pairUp(
        shuffle(mine, random),
        (s) =>
          shuffle(everyone, random)
            .filter((c) => c.gender !== s.gender && missedRequirements(s, c).length > 0)
            .sort((x, y) => scoreTraits(s, y).score - scoreTraits(s, x).score)
            .slice(0, 3),
        () => 'מחוץ למה שביקשו, אבל אולי שווה מחשבה'
      );

    // Several random partners for one of the matchmaker's singles
    case 'single': {
      const source = mine.filter((s) => s._id.toString() === singleId);
      return pairUp(source, () => shuffle(everyone, random), undefined, count);
    }
  }
};
