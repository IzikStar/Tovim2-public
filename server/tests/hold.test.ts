import { describe, expect, it } from 'vitest';
import { Gender } from '../src/models/enums.js';
import { api, createMatchMaker, createSingle } from './helpers.js';

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const setup = async () => {
  const mm = await createMatchMaker();
  const him = await createSingle(mm);
  const her = await createSingle(mm, { firstName: 'Sarah', gender: Gender.FEMALE, birthDate: '1998-03-01' });
  const { body } = await api().post('/proposals').set(mm.auth).send({ singleIds: [him._id, her._id], status: 'proposed' }).expect(201);
  return { mm, him, her, id: body._id as string };
};

describe('proposal on hold', () => {
  it('puts a proposal on hold with who is unavailable, snoozes it, and brings it back', async () => {
    const { mm, her, id } = await setup();
    const put = (body: object) => api().put(`/proposals/${id}`).set(mm.auth).send(body);

    const held = await put({ hold: { until: inDays(14), unavailable: [her._id], reason: 'בשירות לאומי עד החגים' } }).expect(200);
    expect(held.body.status).toBe('proposed');
    expect(held.body.hold).toMatchObject({ unavailable: [her._id], reason: 'בשירות לאומי עד החגים' });
    const since = held.body.hold.since;
    expect(held.body.history.at(-1)).toMatchObject({ kind: 'hold', status: 'proposed', note: 'בשירות לאומי עד החגים' });

    // Snoozing again moves the date but keeps when it started
    const snoozed = await put({ hold: { until: inDays(30), unavailable: [] } }).expect(200);
    expect(new Date(snoozed.body.hold.until).getTime()).toBeGreaterThan(new Date(held.body.hold.until).getTime());
    expect(snoozed.body.hold.since).toBe(since);

    const resumed = await put({ hold: null }).expect(200);
    expect(resumed.body.hold).toBeNull();
    expect(resumed.body.history.at(-1)).toMatchObject({ kind: 'resume' });
    // Taking it off hold again is a no-op, not another history entry
    const again = await put({ hold: null }).expect(200);
    expect(again.body.history).toHaveLength(resumed.body.history.length);
  });

  it('validates the hold', async () => {
    const { mm, id } = await setup();
    const other = await createMatchMaker();
    const stranger = await createSingle(other);
    const put = (body: object) => api().put(`/proposals/${id}`).set(mm.auth).send(body);
    await put({ hold: { until: inDays(-1) } }).expect(400);
    await put({ hold: { until: 'soon' } }).expect(400);
    await put({ hold: { until: inDays(7), unavailable: [stranger._id] } }).expect(400);
    await api().put(`/proposals/${id}`).set(other.auth).send({ hold: { until: inDays(7) } }).expect(403);
  });

  it('closing a held proposal clears the hold, and a closed one cannot be held', async () => {
    const { mm, id } = await setup();
    const put = (body: object) => api().put(`/proposals/${id}`).set(mm.auth).send(body);
    await put({ hold: { until: inDays(7) } }).expect(200);
    const closed = await put({ status: 'closed', closeReason: 'לא מתאים' }).expect(200);
    expect(closed.body.hold).toBeNull();
    await put({ hold: { until: inDays(7) } }).expect(400);
  });
});
