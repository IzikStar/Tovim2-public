import { describe, expect, it } from 'vitest';
import { Gender, Sector } from '../src/models/enums.js';
import { Proposal } from '../src/models/proposal.js';
import { api, createMatchMaker, createSingle } from './helpers.js';

const yearsAgo = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n, d.getMonth(), d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const woman = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Sarah',
  gender: Gender.FEMALE,
  birthDate: yearsAgo(26),
  ...overrides,
});
const ids = (idea: { single: { _id: string }; candidate: { _id: string } }) => [idea.single._id, idea.candidate._id].sort().join(':');

describe('brainstorm', () => {
  it('random pairs are opposite gender, include one of mine and skip known pairs', async () => {
    const mm = await createMatchMaker();
    const other = await createMatchMaker();
    const him = await createSingle(mm);
    const her = await createSingle(mm, woman());
    const poolHer = await createSingle(other, woman({ firstName: 'Pool', isPublic: true }));
    await createSingle(other, woman({ firstName: 'Private', isPublic: false }));
    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, her._id] }).expect(201);

    for (let i = 0; i < 5; i++) {
      const res = await api().get('/proposals/brainstorm?mode=random').set(mm.auth).expect(200);
      // Only him + Pool is new; the private single never shows
      expect(res.body.map(ids)).toEqual([[him._id, poolHer._id].sort().join(':')]);
      const [idea] = res.body;
      expect(idea.single.gender).not.toBe(idea.candidate.gender);
      expect(typeof idea.score).toBe('number');
      expect(Array.isArray(idea.stretches)).toBe(true);
    }
  });

  it('pool mode only pairs with other matchmakers’ public singles', async () => {
    const mm = await createMatchMaker();
    const other = await createMatchMaker();
    await createSingle(mm);
    await createSingle(mm, woman({ firstName: 'Mine' }));
    const poolHer = await createSingle(other, woman({ firstName: 'Pool', isPublic: true }));
    const res = await api().get('/proposals/brainstorm?mode=pool').set(mm.auth).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].candidate).toMatchObject({ _id: poolHer._id, mine: false });
    expect(res.body[0].candidate).not.toHaveProperty('lastName');
  });

  it('waiting mode starts with whoever has gone longest without an open proposal', async () => {
    const mm = await createMatchMaker();
    const busy = await createSingle(mm, { firstName: 'Busy' });
    const old = await createSingle(mm, { firstName: 'Old' });
    const fresh = await createSingle(mm, { firstName: 'Fresh' });
    const her = await createSingle(mm, woman());
    const her2 = await createSingle(mm, woman({ firstName: 'Second' }));
    await api().post('/proposals').set(mm.auth).send({ singleIds: [busy._id, her._id] }).expect(201);
    // Old's only proposal is closed and long ago
    const closed = await api().post('/proposals').set(mm.auth).send({ singleIds: [old._id, her2._id] }).expect(201);
    await Proposal.collection.updateOne(
      { _id: new (await import('mongoose')).Types.ObjectId(closed.body._id) },
      { $set: { status: 'closed', updatedAt: new Date(Date.now() - 40 * 86400000) } }
    );

    const res = await api().get('/proposals/brainstorm?mode=waiting').set(mm.auth).expect(200);
    const firsts = res.body.map((i: any) => i.single.firstName);
    expect(firsts[0]).toBe('Old');
    expect(res.body[0].note).toContain('40');
    // Busy has an open proposal, so isn't in the waiting list as a source
    expect(firsts).not.toContain('Busy');
    expect(res.body.find((i: any) => i.single._id === fresh._id)?.note).toContain('עוד לא הייתה הצעה');
  });

  it('outside mode only returns pairs that break a stated requirement, and says which', async () => {
    const mm = await createMatchMaker();
    await createSingle(mm, { birthDate: yearsAgo(28), desiredAgeRange: { min: 22, max: 30 }, desiredSectors: [Sector.DATI_LEUMI] });
    await createSingle(mm, woman({ firstName: 'Fits' }));
    await createSingle(mm, woman({ firstName: 'Older', birthDate: yearsAgo(35) }));
    await createSingle(mm, woman({ firstName: 'Secular', sectors: [Sector.HILONI] }));
    const res = await api().get('/proposals/brainstorm?mode=outside').set(mm.auth).expect(200);
    // Either side can be the "source", so compare the pairs by name
    const pairs = res.body.map((i: any) => [i.single.firstName, i.candidate.firstName].sort().join('+')).sort();
    expect(pairs).toEqual(['David+Older', 'David+Secular']);
    for (const idea of res.body) expect(idea.stretches.length).toBeGreaterThan(0);
  });

  it('single mode gives several partners for one person and validates input', async () => {
    const mm = await createMatchMaker();
    const him = await createSingle(mm);
    await createSingle(mm, woman({ firstName: 'A' }));
    await createSingle(mm, woman({ firstName: 'B' }));
    await createSingle(mm, woman({ firstName: 'C' }));
    const res = await api().get(`/proposals/brainstorm?mode=single&single=${him._id}&count=2`).set(mm.auth).expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((i: any) => i.single._id === him._id)).toBe(true);

    await api().get('/proposals/brainstorm?mode=single').set(mm.auth).expect(400);
    await api().get('/proposals/brainstorm?mode=nope').set(mm.auth).expect(400);
    await api().get('/proposals/brainstorm').expect(401);
  });
});
