import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { IncomingRequest, OutgoingRequest, RequestStatus } from '../api/types';
import { Badge, EmptyState, ErrorBox, Spinner } from '../components/ui';
import { Button, buttonVariants } from '../components/ui/button';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const STATUS: Record<RequestStatus, { label: string; tone: 'warn' | 'ok' | 'bad' }> = {
  pending: { label: 'ממתינה', tone: 'warn' },
  approved: { label: 'אושרה', tone: 'ok' },
  rejected: { label: 'נדחתה', tone: 'bad' },
};

const TAB =
  '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-muted-foreground transition-colors hover:text-foreground aria-selected:border-primary aria-selected:font-semibold aria-selected:text-primary';
const ROW = 'flex flex-col rounded-lg border bg-card text-card-foreground shadow-soft gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5';

function SingleLine({ r }: { r: IncomingRequest | OutgoingRequest }) {
  if (!r.single) return <span className="text-muted-foreground">מועמד/ת שנמחק/ה</span>;
  const s = r.single;
  return (
    <span>
      <strong>
        {s.firstName} {s.lastName}
      </strong>{' '}
      <span className="text-muted-foreground">
        · {s.age} · {s.city}
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
    <div className="mx-auto max-w-[820px]">
      <h1>בקשות שיתוף</h1>
      <p className="mt-1 text-muted-foreground">כשמאשרים בקשה, המועמד/ת נכנס/ת גם לרשימה שלך, והשדכן/ית ששלח/ה ממשיך/ה לטפל גם כן.</p>
      <div className="my-4 flex gap-1 border-b" role="tablist">
        <button type="button" role="tab" className={TAB} aria-selected={tab === 'incoming'} onClick={() => setTab('incoming')}>
          נכנסות {pending > 0 && <Badge tone="accent">{pending}</Badge>}
        </button>
        <button type="button" role="tab" className={TAB} aria-selected={tab === 'outgoing'} onClick={() => setTab('outgoing')}>
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
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {incoming.map((r) => (
              <li key={r._id} className={ROW}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <SingleLine r={r} />
                  <small className="text-muted-foreground">
                    מאת {r.from ? `${r.from.firstName} ${r.from.lastName}` : 'שדכן/ית שנמחק/ה'} · {formatDate(r.createdAt)}
                  </small>
                </div>
                {r.status === 'pending' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" disabled={busy === r._id} onClick={() => decide(r._id, true)}>
                      אישור
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy === r._id} onClick={() => decide(r._id, false)}>
                      דחייה
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    {r.status === 'approved' && r.single && (
                      <Link to={`/singles/${r.single._id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
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
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {outgoing.map((r) => (
            <li key={r._id} className={ROW}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <SingleLine r={r} />
                <small className="text-muted-foreground">
                  אל {r.to ? `${r.to.firstName} ${r.to.lastName}` : 'שדכן/ית שנמחק/ה'} · {formatDate(r.createdAt)}
                </small>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
