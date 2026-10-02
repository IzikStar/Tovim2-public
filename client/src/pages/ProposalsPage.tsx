import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Proposal, ProposalStatus } from '../api/types';
import { ProposalCard, ProposalDialog } from '../components/proposals';
import { EmptyState, ErrorBox, Spinner } from '../components/ui';
import { matchesQuery } from '../lib/format';
import { BOARD, OPEN, STATUS_LABEL, isStale, lastActivity } from '../lib/proposals';
import { useAsync } from '../lib/useAsync';

type View = 'open' | 'all' | ProposalStatus;

export function ProposalsPage() {
  const proposals = useAsync(() => api.proposals(), []);
  const [open, setOpen] = useState<Proposal | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('open');

  const list = useMemo(
    () =>
      (proposals.data ?? [])
        .filter((p) => (view === 'all' ? true : view === 'open' ? OPEN.includes(p.status) : p.status === view))
        .filter((p) =>
          matchesQuery(query, ...p.sides.flatMap((s) => [s.single?.firstName, s.single?.lastName, s.single?.city]), p.notes)
        ),
    [proposals.data, view, query]
  );

  const counts = useMemo(() => {
    const c = Object.fromEntries(BOARD.map((s) => [s, 0])) as Record<ProposalStatus, number>;
    for (const p of proposals.data ?? []) c[p.status]++;
    return c;
  }, [proposals.data]);
  const stale = (proposals.data ?? []).filter((p) => isStale(p)).length;

  const replace = (p: Proposal) => proposals.setData((proposals.data ?? []).map((x) => (x._id === p._id ? p : x)));
  const remove = (id: string) => proposals.setData((proposals.data ?? []).filter((x) => x._id !== id));

  const columns = view === 'open' ? OPEN : view === 'all' ? BOARD : [view];

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>מעקב הצעות</h1>
          <p className="muted">
            {OPEN.reduce((n, s) => n + counts[s], 0)} פתוחות · {counts.married} התחתנו
            {stale > 0 && <> · {stale} מחכות לעדכון</>}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          placeholder="חיפוש לפי שם, עיר או הערה"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש"
        />
        <div className="segmented" role="group" aria-label="תצוגה">
          {(
            [
              ['open', 'פתוחות'],
              ['married', `התחתנו (${counts.married})`],
              ['closed', `נסגרו (${counts.closed})`],
              ['all', 'הכול'],
            ] as [View, string][]
          ).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {proposals.loading && !proposals.data ? (
        <Spinner />
      ) : proposals.error ? (
        <ErrorBox message={proposals.error} onRetry={proposals.reload} />
      ) : !proposals.data?.length ? (
        <EmptyState title="עוד אין הצעות">
          <p>אפשר לפתוח הצעה מכרטיס של מועמד/ת, או לשמור הצעה אוטומטית מהדשבורד.</p>
        </EmptyState>
      ) : (
        <div className="board">
          {columns.map((status) => {
            const items = list
              .filter((p) => p.status === status)
              .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
            return (
              <section key={status} className={`board__col board__col--${status}`}>
                <h2>
                  {STATUS_LABEL[status]} <span className="muted">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="board__empty">אין כרגע</p>
                ) : (
                  items.map((p) => <ProposalCard key={p._id} proposal={p} onOpen={() => setOpen(p)} />)
                )}
              </section>
            );
          })}
        </div>
      )}

      {open && <ProposalDialog proposal={open} onClose={() => setOpen(null)} onChange={replace} onDelete={remove} />}
    </div>
  );
}
