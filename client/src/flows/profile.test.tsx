// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ME, baseRoutes, mockApi, reply } from '../test/fakeApi';
import { renderApp } from '../test/render';

const passwordForm = () => screen.getByRole('form', { name: 'שינוי סיסמה' });

describe('matchmaker profile', () => {
  it('shows my details and saves changes without touching the password', async () => {
    const api = mockApi(baseRoutes({ 'PUT /matchmakers/:id': ({ body }) => ({ ...ME, ...body }) }));
    const { user } = renderApp('/profile');

    const city = await screen.findByLabelText(/^עיר/);
    expect(city).toHaveValue(ME.city);
    expect(screen.getByLabelText('מגיל')).toHaveValue(22);

    await user.clear(city);
    await user.type(city, 'בית שמש');
    await user.type(screen.getByLabelText('מחיר מינימום'), '3000');
    await user.type(screen.getByLabelText('מחיר מקסימום'), '5000');
    await user.click(screen.getByRole('button', { name: 'שמירה' }));

    expect(await screen.findByText('נשמר ✓')).toBeInTheDocument();
    const sent = api.called('PUT /matchmakers/:id')[0];
    expect(sent.params.id).toBe(ME._id);
    expect(sent.body).toMatchObject({ city: 'בית שמש', priceRange: { min: 3000, max: 5000 }, ageRange: { min: 22, max: 35 } });
    expect(sent.body).not.toHaveProperty('password');
  });

  it('checks the age range before saving', async () => {
    const api = mockApi(baseRoutes());
    const { user } = renderApp('/profile');

    const max = await screen.findByLabelText('עד גיל');
    await user.clear(max);
    await user.type(max, '20');
    await user.click(screen.getByRole('button', { name: 'שמירה' }));

    expect(screen.getByText('טווח גילאים לא תקין')).toBeInTheDocument();
    expect(api.called('PUT /matchmakers/:id')).toHaveLength(0);
  });

  it('changes the password with the current one, after the strength and match checks', async () => {
    const api = mockApi(
      baseRoutes({
        'PUT /matchmakers/:id': ({ body }) =>
          body.currentPassword === 'old-pass1' ? ME : reply(400, { error: 'Current password is incorrect' }),
      })
    );
    const { user } = renderApp('/profile');
    await screen.findByRole('heading', { name: 'הפרופיל שלי' });
    const form = within(passwordForm());
    const submit = form.getByRole('button', { name: 'עדכון סיסמה' });

    await user.type(form.getByLabelText('סיסמה חדשה'), 'onlyletters');
    expect(form.getByText('חוזק: חלשה')).toBeInTheDocument();
    await user.click(submit);
    expect(form.getByText('חסרה הסיסמה הנוכחית')).toBeInTheDocument();
    expect(form.getByText('צריך אות וגם ספרה או סימן')).toBeInTheDocument();

    await user.type(form.getByLabelText('סיסמה נוכחית'), 'wrong-pass1');
    await user.clear(form.getByLabelText('סיסמה חדשה'));
    await user.type(form.getByLabelText('סיסמה חדשה'), 'New-pass-2026');
    expect(form.getByText('חוזק: חזקה')).toBeInTheDocument();
    await user.type(form.getByLabelText('אימות סיסמה חדשה'), 'New-pass-2025');
    await user.click(submit);
    expect(form.getByText('הסיסמאות לא תואמות')).toBeInTheDocument();
    expect(api.called('PUT /matchmakers/:id')).toHaveLength(0);

    await user.clear(form.getByLabelText('אימות סיסמה חדשה'));
    await user.type(form.getByLabelText('אימות סיסמה חדשה'), 'New-pass-2026');
    await user.click(submit);
    expect(await form.findByRole('alert')).toHaveTextContent('הסיסמה הנוכחית שגויה');

    await user.clear(form.getByLabelText('סיסמה נוכחית'));
    await user.type(form.getByLabelText('סיסמה נוכחית'), 'old-pass1');
    await user.click(submit);
    expect(await form.findByText('הסיסמה עודכנה ✓')).toBeInTheDocument();
    expect(api.called('PUT /matchmakers/:id').slice(-1)[0].body).toEqual({ currentPassword: 'old-pass1', password: 'New-pass-2026' });
    expect(form.getByLabelText('סיסמה חדשה')).toHaveValue('');
  });
});
