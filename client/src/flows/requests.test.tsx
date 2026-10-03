// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IncomingRequest, RequestsResponse } from '../api/types';
import { ME, baseRoutes, mockApi, single } from '../test/fakeApi';
import { renderApp } from '../test/render';

const incoming = (status: IncomingRequest['status']): IncomingRequest => ({
  _id: 'r1',
  status,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  single: { _id: 's1', firstName: 'דוד', lastName: 'לוי', gender: 'זכר', sectors: ['דתי/ה לאומי/ת'], age: 29, city: 'חיפה' },
  from: { _id: 'mm2', firstName: 'משה', lastName: 'גרין', city: 'בני ברק' },
  to: ME._id,
});

describe('transfer requests', () => {
  it('approving says the sender keeps handling the single, and shows the request as approved', async () => {
    let data: RequestsResponse = { incoming: [incoming('pending')], outgoing: [] };
    const api = mockApi(
      baseRoutes({
        'GET /requests': () => data,
        'POST /requests/:id/approve': () => {
          data = { incoming: [incoming('approved')], outgoing: [] };
          return data.incoming[0];
        },
      })
    );
    const { user } = renderApp('/requests');

    expect(await screen.findByText(/השדכן\/ית ששלח\/ה ממשיך\/ה לטפל גם כן/)).toBeInTheDocument();
    const row = (await screen.findByText(/מאת משה גרין/)).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'אישור' }));

    expect(api.called('POST /requests/:id/approve')[0].params.id).toBe('r1');
    expect(await within(row).findByText('אושרה')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'לכרטיס' })).toHaveAttribute('href', '/singles/s1');
  });

  it('the share dialog tells the sender the single stays on their list', async () => {
    mockApi(
      baseRoutes({
        'GET /singles/:id': single(),
        'GET /matchmakers/:id/others': [{ _id: 'mm2', firstName: 'משה', lastName: 'גרין', city: 'בני ברק' }],
      })
    );
    const { user } = renderApp('/singles/s1');

    await user.click(await screen.findByRole('button', { name: 'שיתוף עם שדכן/ית' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('דוד נשאר/ת גם ברשימה שלך');
  });
});
