import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { IncomingRequest, OutgoingRequest, RequestStatus } from '../api/types';
import { Badge, EmptyState, ErrorBox, Spinner } from '../components/ui';
import { ageFromBirthYear, formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const STATUS: Record<RequestStatus, { label: string; tone: 'warn' | 'ok' | 'bad' }> = {
  pending: { label: 'ממתינה', tone: 'warn' },
  approved: { label: 'אושרה', tone: 'ok' },
  rejected: { label: 'נדחתה', tone: 'bad' },
};

function SingleLine({ r }: { r: IncomingRequest | OutgoingRequest }) {
  if (!r.single) return <span className="muted">מועמד/ת שנמחק/ה</span>;
  const s = r.single;
  return (
    <span>
      <strong>
        {s.firstName} {s.lastName}
      </strong>{' '}
      <span className="muted">
        · {ageFromBirthYear(s.birthYear)} · {s.city}
      </span>
    </span>
  );
}

export function RequestsPage() {
  const requests = useAsync(() => api.requests(), []);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    setError(null);
    try {
      await (approve ? api.approveRequest(id) : api.rejectRequest(id));
      requests.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'הפעולה נכשלה');
    } finally {
      setBusy(null);
    }
  };

  const incoming = requests.data?.incoming ?? [];
  const outgoing = requests.data?.outgoing ?? [];
  const pending = incoming.filter((r) => r.status === 'pending').length;

  return (
    <div className="page page--narrow">
      <h1>בקשות שיתוף</h1>
      <p className="muted">כשמאשרים בקשה, המועמד/ת נכנס/ת גם לרשימה שלך, והשדכן/ית ששלח/ה ממשיך/ה לטפל גם כן.</p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'incoming'} onClick={() => setTab('incoming')}>
          נכנסות {pending > 0 && <Badge tone="accent">{pending}</Badge>}
        </button>
        <button role="tab" aria-selected={tab === 'outgoing'} onClick={() => setTab('outgoing')}>
          יוצאות
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {requests.loading && !requests.data ? (
        <Spinner />
      ) : requests.error ? (
        <ErrorBox message={requests.error} onRetry={requests.reload} />
      ) : tab === 'incoming' ? (
        incoming.length === 0 ? (
          <EmptyState title="אין בקשות נכנסות" />
        ) : (
          <ul className="req-list">
            {incoming.map((r) => (
              <li key={r._id} className="req card">
                <div className="req__body">
                  <SingleLine r={r} />
                  <small className="muted">
                    מאת {r.from ? `${r.from.firstName} ${r.from.lastName}` : 'שדכן/ית שנמחק/ה'} · {formatDate(r.createdAt)}
                  </small>
                </div>
                {r.status === 'pending' ? (
                  <div className="req__actions">
                    <button className="btn btn--primary btn--sm" disabled={busy === r._id} onClick={() => decide(r._id, true)}>
                      אישור
                    </button>
                    <button className="btn btn--ghost btn--sm" disabled={busy === r._id} onClick={() => decide(r._id, false)}>
                      דחייה
                    </button>
                  </div>
                ) : (
                  <div className="req__actions">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    {r.status === 'approved' && r.single && (
                      <Link to={`/singles/${r.single._id}`} className="btn btn--ghost btn--sm">
                        לכרטיס
                      </Link>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : outgoing.length === 0 ? (
        <EmptyState title="לא שלחת בקשות">
          <p>אפשר לשתף מועמד/ת עם שדכן/ית אחר/ת מתוך הכרטיס שלהם.</p>
        </EmptyState>
      ) : (
        <ul className="req-list">
          {outgoing.map((r) => (
            <li key={r._id} className="req card">
              <div className="req__body">
                <SingleLine r={r} />
                <small className="muted">
                  אל {r.to ? `${r.to.firstName} ${r.to.lastName}` : 'שדכן/ית שנמחק/ה'} · {formatDate(r.createdAt)}
                </small>
              </div>
              <div className="req__actions">
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
