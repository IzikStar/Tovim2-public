import { describe, expect, it } from 'vitest';
import { Single } from '../src/models/single.js';
import { api, createMatchMaker, createSingle, singleData } from './helpers.js';

describe('singles', () => {
  it('GET /public returns only public singles with the safe projection', async () => {
    const mm = await createMatchMaker();
    const pub = await createSingle(mm, { isPublic: true, interests: ['ספורט'] });
    await createSingle(mm, { isPublic: false });

    const res = await api().get('/singles/public').expect(200);
    expect(res.body).toHaveLength(1);
    const [single] = res.body;
    expect(single._id).toBe(pub._id);
    expect(single.firstName).toBe('David');
    expect(single.interests).toEqual(['ספורט']);
    for (const hidden of [
      'lastName',
      'phoneNumber',
      'email',
      'images',
      'referencePhones',
      'nameForPrayer',
      'matchMakers',
      'freeDescription',
      'searchText',
      'birthDate',
    ]) {
      expect(single).not.toHaveProperty(hidden);
    }
    // The pool shows the age, not the exact birth date
    expect(typeof single.age).toBe('number');
  });

  it('stores several sectors and a birth date, and derives the age', async () => {
    const mm = await createMatchMaker();
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - 30, birth.getMonth(), birth.getDate() + 1);
    const created = await createSingle(mm, {
      sectors: ['חסידי/ת', 'חרדי/ת'],
      birthDate: birth.toISOString().slice(0, 10),
    });
    const res = await api().get(`/singles/${created._id}`).set(mm.auth).expect(200);
    expect(res.body.sectors).toEqual(['חסידי/ת', 'חרדי/ת']);
    // Birthday is tomorrow: still 29
    expect(res.body.age).toBe(29);
    expect(res.body).not.toHaveProperty('id');
  });

  it('requires at least one valid sector and a birth date that is not in the future', async () => {
    const mm = await createMatchMaker();
    const send = (overrides: Record<string, unknown>) =>
      api().post('/singles').set(mm.auth).send({ ...singleData(overrides), matchMakerId: mm.id });
    expect((await send({ sectors: [] }).expect(400)).body.fields).toHaveProperty('sectors');
    expect((await send({ sectors: ['nope'] }).expect(400)).body.fields).toBeDefined();
    expect((await send({ birthDate: '2999-01-01' }).expect(400)).body.fields).toHaveProperty('birthDate');
    expect((await send({ birthDate: undefined }).expect(400)).body.fields).toHaveProperty('birthDate');
  });

  it('migrates singles saved with a single sector and a birth year', async () => {
    const { migrateLegacySingles } = await import('../src/migrations.js');
    const { sectors: _s, birthDate: _b, ...rest } = singleData();
    const { insertedId } = await Single.collection.insertOne({
      ...rest,
      sector: 'מסורתי/ת',
      birthYear: 1990,
      matchMakers: [],
    } as any);
    await migrateLegacySingles();
    await migrateLegacySingles(); // idempotent
    const raw: any = await Single.collection.findOne({ _id: insertedId });
    expect(raw.sectors).toEqual(['מסורתי/ת']);
    expect(new Date(raw.birthDate).toISOString()).toBe('1990-01-01T00:00:00.000Z');
    expect(raw).not.toHaveProperty('sector');
    expect(raw).not.toHaveProperty('birthYear');
  });

  it('creating a single requires matchMakerId to be the caller', async () => {
    const a = await createMatchMaker();
    const b = await createMatchMaker();
    await api()
      .post('/singles')
      .set(a.auth)
      .send({ ...singleData(), matchMakerId: b.id })
      .expect(403);
    await api().post('/singles').send({ ...singleData(), matchMakerId: a.id }).expect(401);
  });

  it('create ignores a client-supplied matchMakers list', async () => {
    const a = await createMatchMaker();
    const b = await createMatchMaker();
    const single = await createSingle(a, { matchMakers: [b.id] });
    expect(single.matchMakers).toEqual([a.id]);
  });

  it('owner can update; non-owner gets 403; matchMakers cannot be overwritten', async () => {
    const owner = await createMatchMaker();
    const other = await createMatchMaker();
    const single = await createSingle(owner);

    await api().put(`/singles/${single._id}`).set(other.auth).send({ city: 'Eilat' }).expect(403);

    const res = await api()
      .put(`/singles/${single._id}`)
      .set(owner.auth)
      .send({ city: 'Eilat', matchMakers: [other.id] })
      .expect(200);
    expect(res.body.city).toBe('Eilat');
    expect(res.body.matchMakers).toEqual([owner.id]);
  });

  it('update runs validation', async () => {
    const owner = await createMatchMaker();
    const single = await createSingle(owner);
    await api()
      .put(`/singles/${single._id}`)
      .set(owner.auth)
      .send({ nonCompromisableAttributes: ['only one'] })
      .expect(400);
  });

  it('owner can delete; non-owner gets 403; missing -> 404', async () => {
    const owner = await createMatchMaker();
    const other = await createMatchMaker();
    const single = await createSingle(owner);
    await api().delete(`/singles/${single._id}`).set(other.auth).expect(403);
    await api().delete(`/singles/${single._id}`).set(owner.auth).expect(200);
    await api().delete(`/singles/${single._id}`).set(owner.auth).expect(404);
    expect(await Single.countDocuments()).toBe(0);
  });

  it('GET /:id returns the full profile to owners only', async () => {
    const owner = await createMatchMaker();
    const other = await createMatchMaker();
    const single = await createSingle(owner);
    const res = await api().get(`/singles/${single._id}`).set(owner.auth).expect(200);
    expect(res.body.phoneNumber).toBe('0521112233');
    expect(res.body.referencePhones).toEqual(['0547654321']);
    await api().get(`/singles/${single._id}`).set(other.auth).expect(403);
    await api().get(`/singles/${single._id}`).expect(401);
    await api().get('/singles/000000000000000000000000').set(owner.auth).expect(404);
  });

  it('update can clear optional fields with null', async () => {
    const owner = await createMatchMaker();
    const single = await createSingle(owner, { height: 180, desiredAgeRange: { min: 22, max: 30 } });
    const res = await api()
      .put(`/singles/${single._id}`)
      .set(owner.auth)
      .send({ height: null, desiredAgeRange: null })
      .expect(200);
    expect(res.body.height).toBeNull();
    expect(res.body.desiredAgeRange).toBeNull();
    await api()
      .put(`/singles/${single._id}`)
      .set(owner.auth)
      .send({ desiredAgeRange: { min: 30, max: 22 } })
      .expect(400);
  });

  describe('POST /register/:matchMakerId (public form)', () => {
    it('creates a single linked to the matchmaker, ignoring extra fields', async () => {
      const mm = await createMatchMaker();
      const other = await createMatchMaker();
      const res = await api()
        .post(`/singles/register/${mm.id}`)
        .send({ ...singleData(), matchMakers: [other.id], _id: '000000000000000000000002' })
        .expect(201);
      expect(res.body.matchMakers).toEqual([mm.id]);
      expect(res.body._id).not.toBe('000000000000000000000002');
    });

    it('404 for an unknown or malformed matchmaker id', async () => {
      await api().post('/singles/register/000000000000000000000000').send(singleData()).expect(404);
      await api().post('/singles/register/not-an-id').send(singleData()).expect(404);
      expect(await Single.countDocuments()).toBe(0);
    });

    it('400 for invalid data', async () => {
      const mm = await createMatchMaker();
      await api().post(`/singles/register/${mm.id}`).send({ firstName: 'Only' }).expect(400);
    });
  });
});
