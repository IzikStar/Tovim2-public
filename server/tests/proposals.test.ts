import { describe, expect, it } from 'vitest';
import { Gender, Sector } from '../src/models/enums.js';
import { Single } from '../src/models/single.js';
import { api, createMatchMaker, createSingle } from './helpers.js';

const woman = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Sarah',
  gender: Gender.FEMALE,
  birthYear: 1998,
  ...overrides,
});

describe('proposals', () => {
  it('tracks a match from idea to married and takes both singles off the lists', async () => {
    const mm = await createMatchMaker();
    const him = await createSingle(mm);
    const her = await createSingle(mm, woman());

    const created = await api()
      .post('/proposals')
      .set(mm.auth)
      .send({ singleIds: [him._id, her._id], notes: 'Both love hiking' })
      .expect(201);
    expect(created.body.status).toBe('idea');
    expect(created.body.sides.map((s: any) => s.single.firstName).sort()).toEqual(['David', 'Sarah']);
    expect(created.body.sides[0].response).toBe('pending');

    const id = created.body._id;
    await api().put(`/proposals/${id}`).set(mm.auth).send({ status: 'proposed' }).expect(200);
    const answered = await api()
      .put(`/proposals/${id}`)
      .set(mm.auth)
      .send({
        status: 'dating',
        statusNote: 'First date in the park',
        datesCount: 2,
        sides: [
          { single: him._id, response: 'yes', note: 'Liked her a lot' },
          { single: her._id, response: 'thinking' },
        ],
      })
      .expect(200);
    const hisSide = answered.body.sides.find((s: any) => s.single._id === him._id);
    expect(hisSide).toMatchObject({ response: 'yes', note: 'Liked her a lot' });
    expect(hisSide.respondedAt).toBeTruthy();
    expect(answered.body.history.map((h: any) => h.status)).toEqual(['idea', 'proposed', 'dating']);
    expect(answered.body.history[2].note).toBe('First date in the park');

    await api().put(`/proposals/${id}`).set(mm.auth).send({ status: 'married' }).expect(200);
    const stored = await Single.findById(him._id).lean();
    expect(stored).toMatchObject({ isTaken: true });
    expect(stored!.marriedMatchmaker!.toString()).toBe(mm.id);

    const active = await api().get(`/matchmakers/${mm.id}/singles`).set(mm.auth).expect(200);
    expect(active.body).toHaveLength(0);
    const married = await api().get(`/matchmakers/${mm.id}/married`).set(mm.auth).expect(200);
    expect(married.body).toHaveLength(2);
  });

  it('rejects same-gender pairs, duplicates and singles the matchmaker cannot see', async () => {
    const mm = await createMatchMaker();
    const other = await createMatchMaker();
    const him = await createSingle(mm);
    const alsoHim = await createSingle(mm);
    const her = await createSingle(mm, woman());
    const privateHer = await createSingle(other, woman({ isPublic: false }));
    const poolHer = await createSingle(other, woman({ isPublic: true }));

    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, alsoHim._id] }).expect(400);
    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, privateHer._id] }).expect(403);
    await api().post('/proposals').set(other.auth).send({ singleIds: [him._id, her._id] }).expect(403);

    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, her._id] }).expect(201);
    await api().post('/proposals').set(mm.auth).send({ singleIds: [her._id, him._id] }).expect(409);

    // A pool single is fine, and shows without a last name
    const pool = await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, poolHer._id] }).expect(201);
    const poolSide = pool.body.sides.find((s: any) => s.single._id === poolHer._id);
    expect(poolSide.single.mine).toBe(false);
    expect(poolSide.single).not.toHaveProperty('lastName');
  });

  it('only the owning matchmaker sees and edits a proposal', async () => {
    const mm = await createMatchMaker();
    const other = await createMatchMaker();
    const him = await createSingle(mm);
    const her = await createSingle(mm, woman());
    const { body } = await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, her._id] }).expect(201);

    expect((await api().get('/proposals').set(other.auth).expect(200)).body).toHaveLength(0);
    expect((await api().get(`/proposals?single=${her._id}`).set(mm.auth).expect(200)).body).toHaveLength(1);
    await api().put(`/proposals/${body._id}`).set(other.auth).send({ status: 'closed' }).expect(403);
    await api().put(`/proposals/${body._id}`).set(mm.auth).send({ status: 'bogus' }).expect(400);
    await api().delete(`/proposals/${body._id}`).set(other.auth).expect(403);
    await api().delete(`/proposals/${body._id}`).set(mm.auth).expect(200);
    await api().get('/proposals').expect(401);
  });

  it('deleting a single removes its proposals', async () => {
    const mm = await createMatchMaker();
    const him = await createSingle(mm);
    const her = await createSingle(mm, woman());
    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, her._id] }).expect(201);
    await api().delete(`/singles/${her._id}`).set(mm.auth).expect(200);
    expect((await api().get('/proposals').set(mm.auth).expect(200)).body).toHaveLength(0);
  });
});

describe('suggestions', () => {
  it('suggests compatible pairs, respects stated requirements and skips known pairs', async () => {
    const mm = await createMatchMaker();
    const other = await createMatchMaker();
    const him = await createSingle(mm, {
      birthYear: new Date().getFullYear() - 28,
      desiredSectors: [Sector.DATI_LEUMI],
      desiredAgeRange: { min: 22, max: 30 },
      interests: ['ספורט', 'טיולים'],
    });
    const good = await createSingle(other, woman({
      firstName: 'Good',
      isPublic: true,
      birthYear: new Date().getFullYear() - 26,
      interests: ['טיולים'],
      city: 'Haifa',
    }));
    // Too old for his range
    await createSingle(other, woman({ firstName: 'Old', isPublic: true, birthYear: new Date().getFullYear() - 40 }));
    // Wrong sector for him
    await createSingle(other, woman({ firstName: 'Far', isPublic: true, sector: Sector.HILONI, birthYear: new Date().getFullYear() - 26 }));
    // Private to the other matchmaker
    await createSingle(other, woman({ firstName: 'Hidden', isPublic: false, birthYear: new Date().getFullYear() - 26 }));

    const res = await api().get('/proposals/suggestions').set(mm.auth).expect(200);
    expect(res.body).toHaveLength(1);
    const [sug] = res.body;
    expect(sug.single._id).toBe(him._id);
    expect(sug.candidate).toMatchObject({ _id: good._id, firstName: 'Good', mine: false });
    expect(sug.candidate).not.toHaveProperty('lastName');
    expect(sug.score).toBeGreaterThan(50);
    expect(sug.reasons.join(' ')).toContain('טיולים');

    await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, good._id] }).expect(201);
    expect((await api().get('/proposals/suggestions').set(mm.auth).expect(200)).body).toHaveLength(0);
  });
});

describe('singles extras from dev', () => {
  it('creates singles in bulk, validating all of them first', async () => {
    const mm = await createMatchMaker();
    const { singleData } = await import('./helpers.js');
    await api()
      .post('/singles/bulk')
      .set(mm.auth)
      .send({ matchMakerId: mm.id, singles: [singleData(), { firstName: 'Broken' }] })
      .expect(400);
    expect(await Single.countDocuments()).toBe(0);
    const res = await api()
      .post('/singles/bulk')
      .set(mm.auth)
      .send({ matchMakerId: mm.id, singles: [singleData(), singleData({ email: '' })] })
      .expect(201);
    expect(res.body).toHaveLength(2);
  });

  it('email is optional, and marking a single taken hides it from the pool', async () => {
    const mm = await createMatchMaker();
    const a = await createSingle(mm, { email: '' });
    await createSingle(mm, { email: undefined });
    await api().put(`/singles/${a._id}`).set(mm.auth).send({ isTaken: true }).expect(200);
    const pool = await api().get('/singles/public').expect(200);
    expect(pool.body.map((s: any) => s._id)).not.toContain(a._id);
  });

  it('matchmakers can store an age range, a price range and an about text', async () => {
    const mm = await createMatchMaker();
    const res = await api()
      .put(`/matchmakers/${mm.id}`)
      .set(mm.auth)
      .send({ ageRange: { min: 20, max: 35 }, priceRange: { min: 2000, max: 5000 }, about: 'Ten years of matches' })
      .expect(200);
    expect(res.body).toMatchObject({ ageRange: { min: 20, max: 35 }, priceRange: { min: 2000, max: 5000 } });
    await api().put(`/matchmakers/${mm.id}`).set(mm.auth).send({ ageRange: { min: 40, max: 30 } }).expect(400);
  });
});
