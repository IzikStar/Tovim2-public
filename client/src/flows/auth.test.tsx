// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ME, baseRoutes, mockApi, reply } from '../test/fakeApi';
import { renderApp } from '../test/render';

describe('login', () => {
  it('logs in and lands on the dashboard', async () => {
    const api = mockApi(
      baseRoutes({
        'POST /auth/login': ({ body }) =>
          body.password === 'good-pass1' ? { token: 'new-token', matchMakerId: ME._id } : reply(401, { error: 'Invalid credentials' }),
      })
    );
    const { user } = renderApp('/login', { loggedIn: false });

    await user.type(await screen.findByLabelText('אימייל'), ` ${ME.email} `);
    await user.type(screen.getByLabelText('סיסמה'), 'good-pass1');
    await user.click(screen.getByRole('button', { name: 'כניסה' }));

    expect(await screen.findByRole('heading', { name: `שלום, ${ME.firstName}` })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(localStorage.getItem('tovim.token')).toBe('new-token');
    // The email is trimmed before it is sent
    expect(api.called('POST /auth/login')[0].body).toEqual({ email: ME.email, password: 'good-pass1' });
  });

  it('shows a Hebrew error for wrong credentials and stays on the page', async () => {
    mockApi(baseRoutes({ 'POST /auth/login': reply(401, { error: 'Invalid credentials' }) }));
    const { user } = renderApp('/login', { loggedIn: false });

    await user.type(await screen.findByLabelText('אימייל'), ME.email);
    await user.type(screen.getByLabelText('סיסמה'), 'wrong-pass1');
    await user.click(screen.getByRole('button', { name: 'כניסה' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('אימייל או סיסמה שגויים');
    expect(window.location.pathname).toBe('/login');
    expect(localStorage.getItem('tovim.token')).toBeNull();
  });

  it('sends a logged-out visitor of a private page to login, then back there', async () => {
    mockApi(baseRoutes({ 'POST /auth/login': { token: 't', matchMakerId: ME._id } }));
    const { user } = renderApp('/proposals', { loggedIn: false });

    expect(await screen.findByRole('heading', { name: 'כניסה לשדכנים' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('אימייל'), ME.email);
    await user.type(screen.getByLabelText('סיסמה'), 'good-pass1');
    await user.click(screen.getByRole('button', { name: 'כניסה' }));

    await waitFor(() => expect(window.location.pathname).toBe('/proposals'));
    expect(await screen.findByRole('heading', { name: 'מעקב הצעות' })).toBeInTheDocument();
  });

  it('drops an expired stored token and asks to log in', async () => {
    mockApi(baseRoutes({ 'GET /matchmakers/me': reply(401, { error: 'Invalid token' }) }));
    renderApp('/dashboard');

    expect(await screen.findByRole('heading', { name: 'כניסה לשדכנים' })).toBeInTheDocument();
    expect(localStorage.getItem('tovim.token')).toBeNull();
  });
});
