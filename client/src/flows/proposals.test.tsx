// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Proposal } from '../api/types';
import { baseRoutes, mockApi, proposal } from '../test/fakeApi';
import { renderApp } from '../test/render';

const DAY = 86_400_000;
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY).toISOString();
const column = (status: string) => document.querySelector(`section[data-status="${status}"]`) as HTMLElement;
/** The board shows once the proposals load. */
const board = () => waitFor(() => expect(column('idea')).not.toBeNull());

describe('proposals board', () => {
  it('puts each proposal in its status column, and waiting ones in their own', async () => {
    mockApi(
      baseRoutes({
        'GET /proposals': [
          proposal({ _id: 'p1', status: 'idea' }),
          proposal({ _id: 'p2', status: 'dating' }),
          proposal({ _id: 'p3', status: 'proposed', hold: { until: daysFromNow(10), since: daysFromNow(-1), unavailable: ['s1'] } }),
          proposal({ _id: 'p4', status: 'closed' }),
        ],
      })
    );
    renderApp('/proposals');

    await board();
    expect(within(column('idea')).getByText('1')).toBeInTheDocument();
    expect(within(column('dating')).getByText('1')).toBeInTheDocument();
    expect(within(column('proposed')).getByText('0')).toBeInTheDocument();
    expect(within(column('hold')).getByText('1')).toBeInTheDocument();
    // Closed ones only show under their own view
    expect(column('closed')).toBeNull();
  });

  it('changes a status from the dialog and saves it', async () => {
    const api = mockApi(
      baseRoutes({
        'GET /proposals': [proposal({ _id: 'p1', status: 'idea' })],
        'PUT /proposals/:id': ({ body }) => proposal({ _id: 'p1', status: body.status ?? 'idea' }),
      })
    );
    const { user } = renderApp('/proposals');
    await board();

    await user.click(within(column('idea')).getByRole('button', { name: /דוד/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(within(dialog).getByRole('radiogroup', { name: 'סטטוס' })).getByRole('radio', { name: /נפגשים/ }));
    await user.click(within(dialog).getByRole('button', { name: /^שמירה/ }));

    expect(api.called('PUT /proposals/:id')[0]).toMatchObject({ params: { id: 'p1' }, body: { status: 'dating' } });
    await within(column('dating')).findByText('1');
  });
});

describe('on hold', () => {
  it('puts a proposal on hold until a chosen date and moves it to the waiting column', async () => {
    let stored: Proposal = proposal({ _id: 'p1', status: 'proposed' });
    const api = mockApi(
      baseRoutes({
        'GET /proposals': () => [stored],
        'PUT /proposals/:id': ({ body }) => {
          stored = { ...stored, hold: body.hold && { ...body.hold, since: new Date().toISOString() } };
          return stored;
        },
      })
    );
    const { user } = renderApp('/proposals');
    await board();

    await user.click(within(column('proposed')).getByRole('button', { name: /דוד/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'לשים בהמתנה' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'שרה מזרחי' }));
    await user.click(within(dialog).getByRole('button', { name: 'שבועיים' }));
    await user.type(within(dialog).getByPlaceholderText(/למה/), 'בחו"ל');
    await user.click(within(dialog).getByRole('button', { name: /^בהמתנה עד/ }));

    const sent = api.called('PUT /proposals/:id')[0].body.hold;
    expect(sent.unavailable).toEqual(['s2']);
    expect(sent.reason).toBe('בחו"ל');
    const days = (new Date(sent.until).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(13);
    expect(days).toBeLessThan(15);

    await user.click(within(dialog).getByRole('button', { name: 'סגירה' }));
    await within(column('hold')).findByText('1');
    expect(within(column('proposed')).getByText('0')).toBeInTheDocument();
  });

  it('shows a proposal whose hold date passed back in its column, and takes it off hold', async () => {
    let stored: Proposal = proposal({
      _id: 'p1',
      status: 'dating',
      hold: { until: daysFromNow(-1), since: daysFromNow(-20), unavailable: [], reason: 'מילואים' },
    });
    const api = mockApi(
      baseRoutes({
        'GET /proposals': () => [stored],
        'PUT /proposals/:id': () => (stored = { ...stored, hold: null }),
      })
    );
    const { user } = renderApp('/proposals');
    await board();

    const card = within(column('dating')).getByRole('button', { name: /זמן ההמתנה עבר/ });
    expect(within(column('hold')).getByText('0')).toBeInTheDocument();
    // The header nav counts it too
    expect(screen.getByTitle('1 הצעות חוזרות מהמתנה')).toBeInTheDocument();

    await user.click(card);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'חוזרים לטפל' }));

    expect(api.called('PUT /proposals/:id')[0].body).toEqual({ hold: null });
    await user.click(within(dialog).getByRole('button', { name: 'סגירה' }));
    expect(within(column('dating')).queryByText(/זמן ההמתנה עבר/)).not.toBeInTheDocument();
  });
});
