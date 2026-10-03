import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/** Renders the whole app at `path`, with a stored token when `loggedIn`. */
export function renderApp(path: string, { loggedIn = true } = {}) {
  if (loggedIn) localStorage.setItem('tovim.token', 'test-token');
  window.history.pushState({}, '', path);
  const user = userEvent.setup();
  return { user, ...render(<App />) };
}
