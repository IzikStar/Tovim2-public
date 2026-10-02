import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Proposal, ProposalStatus } from '../api/types';
import { ProposalCard, ProposalDialog } from '../components/proposals';
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { Input } from '../components/ui/input';
import { matchesQuery } from '../lib/format';
import { BOARD, OPEN, STATUS_LABEL, holdState, isStale, lastActivity } from '../lib/proposals';
import { useAsync } from '../lib/useAsync';
import { cn } from '../lib/utils';

/** Board columns: the statuses, plus a column for proposals waiting on hold. */
type Column = ProposalStatus | 'hold';

const COLUMN_ACCENT: Record<Column, string> = {
  hold: 'border-t-muted-foreground/40',
  idea: 'border-t-input',
  proposed: 'border-t-warning/60',
  dating: 'border-t-primary',
  engaged: 'border-t-secondary',
  married: 'border-t-secondary',
  closed: 'border-t-destructive/50',
};

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
  const waiting = (proposals.data ?? []).filter((p) => holdState(p) === 'waiting').length;
  const due = (proposals.data ?? []).filter((p) => holdState(p) === 'due').length;

  const replace = (p: Proposal) => proposals.setData((proposals.data ?? []).map((x) => (x._id === p._id ? p : x)));
  const remove = (id: string) => proposals.setData((proposals.data ?? []).filter((x) => x._id !== id));

  // Waiting proposals get their own column; once due they're back in their status column
  const columns: Column[] = view === 'open' ? [...OPEN, 'hold'] : view === 'all' ? [...OPEN, 'hold', 'married', 'closed'] : [view];

  return (
    <div>
      <PageHeader
        title="מעקב הצעות"
        subtitle={
          <>
            {OPEN.reduce((n, s) => n + counts[s], 0)} פתוחות · {counts.married} התחתנו
            {stale > 0 && <> · {stale} מחכות לעדכון</>}
            {waiting > 0 && <> · {waiting} בהמתנה</>}
            {due > 0 && <> · {due} חוזרות לטיפול</>}
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          className="sm:min-w-[220px] sm:flex-1"
          type="search"
          placeholder="חיפוש לפי שם, עיר או הערה"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש"
        />
        <div
          className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1 sm:inline-flex"
          role="group"
          aria-label="תצוגה"
        >
          {(
            [
              ['open', 'פתוחות'],
              ['married', `התחתנו (${counts.married})`],
              ['closed', `נסגרו (${counts.closed})`],
              ['all', 'הכול'],
            ] as [View, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-sm px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
                view === value && 'bg-card font-semibold text-foreground shadow-sm'
              )}
            >
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
        <div
          className={cn(
            '-mx-4 flex snap-x snap-mandatory items-start gap-3.5 overflow-x-auto px-4 pb-3 sm:-mx-5 sm:px-5',
            'md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0',
            columns.length === 1
              ? 'md:grid-cols-1'
              : 'md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
          )}
        >
          {columns.map((status) => {
            const items = list
              .filter((p) =>
                status === 'hold' ? holdState(p) === 'waiting' : p.status === status && holdState(p) !== 'waiting'
              )
              .sort((a, b) =>
                status === 'hold'
                  ? a.hold!.until.localeCompare(b.hold!.until)
                  : // Back from hold first, then most recent activity
                    Number(holdState(b) === 'due') - Number(holdState(a) === 'due') || lastActivity(b).localeCompare(lastActivity(a))
              );
            return (
              <section
                key={status}
                data-status={status}
                className={cn(
                  'flex min-h-[120px] w-[80vw] max-w-[300px] shrink-0 snap-start flex-col gap-2.5 rounded-lg border-t-4 bg-muted p-3 md:w-auto md:max-w-none',
                  columns.length === 1 && 'w-full max-w-none',
                  COLUMN_ACCENT[status]
                )}
              >
                <h2 className="mx-1 my-0.5 flex items-center justify-between text-base">
                  {status === 'hold' ? 'בהמתנה' : STATUS_LABEL[status]} <span className="text-sm font-medium text-muted-foreground">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="my-3 text-center text-sm text-muted-foreground">אין כרגע</p>
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
