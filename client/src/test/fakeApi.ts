import { vi } from 'vitest';
import type { MatchMaker, Proposal, ProposalPerson, Single } from '../api/types';

/** A non-2xx answer from a route handler. */
export class Reply {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {}
}
export const reply = (status: number, body: unknown) => new Reply(status, body);

export interface ApiCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: any;
  params: Record<string, string>;
}

/** A fixed answer, or a function of the call. Keys look like "GET /singles/:id". */
type Route = ((call: ApiCall) => unknown) | object | string | number | boolean | null;

const match = (pattern: string, path: string): Record<string, string> | null => {
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
};

/**
 * Replaces fetch with an in-memory server. Every request is recorded in
 * `calls`; one with no route gets a 404 and is also listed in `unhandled`.
 */
export function mockApi(routes: Record<string, Route>) {
  const calls: ApiCall[] = [];
  const unhandled: string[] = [];
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input, 'http://localhost');
    const method = (init.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api/, '');
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    for (const [key, route] of Object.entries(routes)) {
      const [m, pattern] = key.split(' ');
      const params = m === method ? match(pattern, path) : null;
      if (!params) continue;
      const call = { method, path, query: url.searchParams, body, params };
      calls.push(call);
      const result = typeof route === 'function' ? await (route as (c: ApiCall) => unknown)(call) : route;
      const [status, data] = result instanceof Reply ? [result.status, result.body] : [200, result];
      return new Response(JSON.stringify(data ?? null), { status, headers: { 'Content-Type': 'application/json' } });
    }
    unhandled.push(`${method} ${path}`);
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    calls,
    unhandled,
    /** Calls to one route, e.g. called('PUT /matchmakers/:id') */
    called: (key: string) => {
      const [m, pattern] = key.split(' ');
      return calls.filter((c) => c.method === m && match(pattern, c.path));
    },
  };
}

// ---------- fixtures ----------

export const ME: MatchMaker = {
  _id: 'mm1',
  firstName: 'רחל',
  lastName: 'כהן',
  phoneNumber: '0501234567',
  email: 'rachel@example.com',
  city: 'ירושלים',
  gender: 'נקבה',
  sector: 'דתי/ה לאומי/ת',
  expertSectors: ['דתי/ה לאומי/ת'],
  ageRange: { min: 22, max: 35 },
  priceRange: null,
  about: 'שדכנית ותיקה',
};

export const single = (overrides: Partial<Single> = {}): Single => ({
  _id: 's1',
  firstName: 'דוד',
  lastName: 'לוי',
  phoneNumber: '0521112233',
  city: 'חיפה',
  gender: 'זכר',
  sectors: ['דתי/ה לאומי/ת'],
  birthDate: '1997-05-20',
  age: 29,
  marriageStatus: 'רווק/ה',
  numOfChildren: 0,
  ethnicity: 'מעורב/ת',
  workAndStudyPlaces: [],
  attributes: [],
  lookingForAttributes: [],
  nonCompromisableAttributes: ['א', 'ב', 'ג', 'ד'],
  desiredSectors: [],
  isPublic: false,
  images: [],
  interests: [],
  otherInterests: [],
  shareInWhatsappGroups: false,
  proposePreference: 'ללא העדפה',
  referencePhones: [],
  matchMakers: ['mm1'],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

export const person = (overrides: Partial<ProposalPerson> = {}): ProposalPerson => ({
  _id: 's1',
  firstName: 'דוד',
  lastName: 'לוי',
  gender: 'זכר',
  sectors: ['דתי/ה לאומי/ת'],
  age: 29,
  city: 'חיפה',
  mine: true,
  ...overrides,
});

export const proposal = (overrides: Partial<Proposal> = {}): Proposal => {
  const at = overrides.updatedAt ?? new Date().toISOString();
  return {
    _id: 'p1',
    sides: [
      { single: person(), response: 'pending' },
      { single: person({ _id: 's2', firstName: 'שרה', lastName: 'מזרחי', gender: 'נקבה', age: 26, city: 'ירושלים' }), response: 'pending' },
    ],
    status: 'idea',
    datesCount: 0,
    history: [{ status: 'idea', at }],
    hold: null,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
};

/** Routes every logged-in page needs (the header, the dashboard lists); override per test. */
export const baseRoutes = (overrides: Record<string, Route> = {}): Record<string, Route> => ({
  'GET /matchmakers/me': ME,
  'GET /matchmakers/:id/singles': [],
  'GET /proposals': [],
  'GET /proposals/suggestions': [],
  'GET /requests': { incoming: [], outgoing: [] },
  ...overrides,
});
