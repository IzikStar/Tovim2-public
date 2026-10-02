// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BrainstormIdea } from '../api/types';
import { baseRoutes, mockApi, person, proposal, single } from '../test/fakeApi';
import { renderApp } from '../test/render';

const idea = (n: number, overrides: Partial<BrainstormIdea> = {}): BrainstormIdea => ({
  single: person({ _id: `a${n}`, firstName: `בחור${n}` }),
  candidate: person({ _id: `b${n}`, firstName: `בחורה${n}`, gender: 'נקבה', mine: false }),
  score: 60 + n,
  reasons: ['שניהם אוהבים טיולים'],
  stretches: [],
  ...overrides,
});

describe('brainstorm', () => {
  it('shows random ideas, saves one as an idea and dismisses another', async () => {
    const api = mockApi(
      baseRoutes({
        'GET /proposals/brainstorm': [idea(1, { stretches: ['פער גילאים גדול מהמבוקש'] }), idea(2)],
        'POST /proposals': proposal(),
      })
    );
    const { user } = renderApp('/brainstorm');

    const first = (await screen.findByText(/^בחור1 /)).closest('.relative') as HTMLElement;
    expect(within(first).getByText('פער גילאים גדול מהמבוקש')).toBeInTheDocument();
    expect(api.called('GET /proposals/brainstorm')[0].query.get('mode')).toBe('random');

    await user.click(within(first).getByRole('button', { name: 'שמירה כרעיון' }));
    expect(api.called('POST /proposals')[0].body).toMatchObject({ singleIds: ['a1', 'b1'], status: 'idea' });
    expect(await screen.findByRole('status')).toHaveTextContent('נשמר רעיון אחד');
    expect(screen.queryByText(/^בחור1 /)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'לא הפעם' }));
    expect(screen.getByText('אין כרגע רעיונות חדשים כאן')).toBeInTheDocument();
  });

  it('asks for a single in "single" mode and then brainstorms for them', async () => {
    const api = mockApi(
      baseRoutes({
        'GET /matchmakers/:id/singles': [single({ _id: 's9', firstName: 'אלי', lastName: 'פרץ' })],
        'GET /proposals/brainstorm': ({ query }) => (query.get('mode') === 'single' ? [idea(3)] : []),
      })
    );
    const { user } = renderApp('/brainstorm');

    await screen.findByText('אין כרגע רעיונות חדשים כאן');
    const modes = screen.getAllByRole('radio');
    await user.click(modes[modes.length - 1]);
    expect(screen.getByText('בוחרים מועמד/ת')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ערבוב מחדש' })).toBeDisabled();

    await user.selectOptions(await screen.findByRole('combobox', { name: 'מועמד/ת' }), 's9');
    expect(await screen.findByText(/^בחור3 /)).toBeInTheDocument();
    const last = api.called('GET /proposals/brainstorm').slice(-1)[0];
    expect(last.query.get('mode')).toBe('single');
    expect(last.query.get('single')).toBe('s9');
  });
});
