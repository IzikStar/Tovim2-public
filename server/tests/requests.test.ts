import { describe, expect, it } from 'vitest';
import { Single } from '../src/models/single.js';
import { TransferRequest } from '../src/models/transferRequest.js';
import { api, createMatchMaker, createSingle, LoggedInMatchMaker } from './helpers.js';

const setup = async () => {
  const from = await createMatchMaker({ firstName: 'From' });
  const to = await createMatchMaker({ firstName: 'To' });
  const single = await createSingle(from);
  return { from, to, single };
};

const send = (from: LoggedInMatchMaker, singleId: string, toMatchMakerId: string) =>
  api().post('/requests').set(from.auth).send({ singleId, toMatchMakerId });

describe('transfer requests', () => {
  it('create -> approve adds the target matchmaker and keeps the sender on the single', async () => {
    const { from, to, single } = await setup();
    const created = await send(from, single._id, to.id).expect(201);
    expect(created.body.status).toBe('pending');

    // only the target may decide
    await api().post(`/requests/${created.body._id}/approve`).set(from.auth).expect(403);

    const approved = await api().post(`/requests/${created.body._id}/approve`).set(to.auth).expect(200);
    expect(approved.body.status).toBe('approved');

    const stored = await Single.findById(single._id).lean();
    expect(stored!.matchMakers.map(String)).toEqual([from.id, to.id]);
  });

  it('reject works (status enum includes rejected) and does not change the single', async () => {
    const { from, to, single } = await setup();
    const created = await send(from, single._id, to.id).expect(201);
    await api().post(`/requests/${created.body._id}/reject`).set(from.auth).expect(403);
    const rejected = await api().post(`/requests/${created.body._id}/reject`).set(to.auth).expect(200);
    expect(rejected.body.status).toBe('rejected');
    expect((await TransferRequest.findById(created.body._id))!.status).toBe('rejected');
    const stored = await Single.findById(single._id).lean();
    expect(stored!.matchMakers.map(String)).toEqual([from.id]);
  });

  it('only pending requests can be decided', async () => {
    const { from, to, single } = await setup();
    const a = await send(from, single._id, to.id).expect(201);
    await api().post(`/requests/${a.body._id}/reject`).set(to.auth).expect(200);
    await api().post(`/requests/${a.body._id}/approve`).set(to.auth).expect(400);
    await api().post(`/requests/${a.body._id}/reject`).set(to.auth).expect(400);

    const b = await send(from, single._id, to.id).expect(201);
    await api().post(`/requests/${b.body._id}/approve`).set(to.auth).expect(200);
    await api().post(`/requests/${b.body._id}/approve`).set(to.auth).expect(400);
    await api().post(`/requests/${b.body._id}/reject`).set(to.auth).expect(400);
  });

  it('rejects duplicate pending requests', async () => {
    const { from, to, single } = await setup();
    await send(from, single._id, to.id).expect(201);
    await send(from, single._id, to.id).expect(409);
    expect(await TransferRequest.countDocuments()).toBe(1);
  });

  it('validates the target and the single', async () => {
    const { from, to, single } = await setup();
    const stranger = await createMatchMaker();
    await send(from, single._id, from.id).expect(400); // to self
    await send(from, single._id, '000000000000000000000000').expect(404); // unknown target
    await send(from, single._id, 'garbage').expect(400);
    await send(from, '000000000000000000000000', to.id).expect(404); // unknown single
    await send(stranger, single._id, to.id).expect(403); // not the sender's single
    await api().post('/requests').set(from.auth).send({}).expect(400);

    // target already handles the single
    const r = await send(from, single._id, to.id).expect(201);
    await api().post(`/requests/${r.body._id}/approve`).set(to.auth).expect(200);
    await send(from, single._id, to.id).expect(400);
    expect(await TransferRequest.countDocuments()).toBe(1);
  });

  it('unknown request -> 404, malformed id -> 400', async () => {
    const { to } = await setup();
    await api().post('/requests/000000000000000000000000/approve').set(to.auth).expect(404);
    await api().post('/requests/not-an-id/reject').set(to.auth).expect(400);
  });

  it('GET /requests lists incoming and outgoing for the caller', async () => {
    const { from, to, single } = await setup();
    const third = await createMatchMaker();
    await send(from, single._id, to.id).expect(201);

    const mine = await api().get('/requests').set(from.auth).expect(200);
    expect(mine.body.incoming).toHaveLength(0);
    expect(mine.body.outgoing).toHaveLength(1);
    expect(mine.body.outgoing[0].to.firstName).toBe('To');
    expect(mine.body.outgoing[0].single.firstName).toBe('David');

    const theirs = await api().get('/requests').set(to.auth).expect(200);
    expect(theirs.body.outgoing).toHaveLength(0);
    expect(theirs.body.incoming).toHaveLength(1);
    expect(theirs.body.incoming[0].from.firstName).toBe('From');
    expect(theirs.body.incoming[0].from).not.toHaveProperty('email');
    expect(theirs.body.incoming[0].from).not.toHaveProperty('password');

    const none = await api().get('/requests').set(third.auth).expect(200);
    expect(none.body).toEqual({ incoming: [], outgoing: [] });

    await api().get('/requests').expect(401);
  });
});
