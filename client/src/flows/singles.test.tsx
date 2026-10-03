// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ME, baseRoutes, mockApi, single } from '../test/fakeApi';
import { renderApp } from '../test/render';

const DAVID = single();
const SARAH = single({ _id: 's2', firstName: 'שרה', lastName: 'מזרחי', gender: 'נקבה', city: 'ירושלים', updatedAt: '2026-09-10T10:00:00.000Z' });

describe('singles list', () => {
  it('lists my singles, newest first, and filters them by search', async () => {
    const api = mockApi(baseRoutes({ 'GET /matchmakers/:id/singles': [DAVID, SARAH] }));
    const { user } = renderApp('/dashboard');

    const sarah = await screen.findByText('שרה מזרחי');
    const david = screen.getByText('דוד לוי');
    // Sarah was updated later, so she comes first
    expect(sarah.compareDocumentPosition(david) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(api.called('GET /matchmakers/:id/singles')[0].params.id).toBe(ME._id);

    await user.type(screen.getByRole('searchbox', { name: /חיפוש/ }), 'חיפה');
    expect(screen.getByText('דוד לוי')).toBeInTheDocument();
    expect(screen.queryByText('שרה מזרחי')).not.toBeInTheDocument();
  });
});

describe('new single form', () => {
  it('marks missing required fields and sends nothing', async () => {
    const api = mockApi(baseRoutes());
    const { user } = renderApp('/singles/new');

    await user.click(await screen.findByRole('button', { name: 'שמירת מועמד/ת' }));

    expect(screen.getByText('יש שדות שצריך לתקן. הם מסומנים באדום.')).toBeInTheDocument();
    expect(screen.getByText('חסר שם פרטי')).toBeInTheDocument();
    expect(screen.getByText('צריך לבחור לפחות מגזר אחד')).toBeInTheDocument();
    expect(screen.getByText('צריך למלא בדיוק ארבע תכונות')).toBeInTheDocument();
    expect(api.called('POST /singles')).toHaveLength(0);
  });

  it('creates a single and opens their card', async () => {
    const api = mockApi(
      baseRoutes({
        'POST /singles': ({ body }) => single({ ...body, _id: 'new1' }),
        'GET /singles/:id': single({ _id: 'new1', firstName: 'יוסף', lastName: 'אברהם' }),
      })
    );
    const { user } = renderApp('/singles/new');

    await user.type(await screen.findByLabelText(/^שם פרטי/), 'יוסף');
    await user.type(screen.getByLabelText(/^שם משפחה/), 'אברהם');
    await user.selectOptions(screen.getByLabelText(/^מגדר/), 'זכר');
    await user.type(screen.getByLabelText(/^תאריך לידה/), '1998-03-15');
    await user.type(screen.getByLabelText(/^עיר מגורים/), 'צפת');
    await user.type(screen.getByLabelText(/^טלפון/), '050-765-4321');
    await user.click(within(screen.getByRole('group', { name: 'מגזר' })).getByRole('button', { name: 'חרדלי/ת' }));
    await user.selectOptions(screen.getByLabelText(/^מוצא/), 'תימני/ת');
    for (let i = 1; i <= 4; i++) {
      await user.type(screen.getByLabelText(`דבר ${i} שאין עליו פשרה`), `תכונה ${i}`);
    }
    await user.click(screen.getByRole('button', { name: 'שמירת מועמד/ת' }));

    expect(await screen.findByRole('heading', { name: /יוסף אברהם/ })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/singles/new1');
    const sent = api.called('POST /singles')[0].body;
    expect(sent).toMatchObject({
      matchMakerId: ME._id,
      firstName: 'יוסף',
      lastName: 'אברהם',
      gender: 'זכר',
      birthDate: '1998-03-15',
      city: 'צפת',
      phoneNumber: '0507654321',
      sectors: ['חרדלי/ת'],
      ethnicity: 'תימני/ת',
      nonCompromisableAttributes: ['תכונה 1', 'תכונה 2', 'תכונה 3', 'תכונה 4'],
    });
  });
});
