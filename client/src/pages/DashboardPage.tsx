import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import type { Proposal } from '../api/types';
import { AddSingleDialog, ShareRegistration } from '../components/AddSingleDialog';
import { ProposalCard, ProposalDialog, SuggestionCard } from '../components/proposals';
import { SingleCard } from '../components/SingleCard';
import { Plus, Shuffle } from 'lucide-react';
import { Badge, EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { buttonVariants, Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { matchesQuery } from '../lib/format';
import { OPEN, isStale } from '../lib/proposals';
import { useAsync } from '../lib/useAsync';

const STAT_TONE = {
  primary: { value: 'text-primary', blob: 'bg-primary-soft' },
  secondary: { value: 'text-secondary', blob: 'bg-accent' },
  gold: { value: 'text-gold', blob: 'bg-gold-soft' },
} as const;

function Stat({
  value,
  label,
  to,
  tone = 'primary',
}: {
  value: number | string;
  label: string;
  to?: string;
  tone?: keyof typeof STAT_TONE;
}) {
  const body = (
    <>
      <span
        className={cn('pointer-events-none absolute -end-6 -top-6 size-20 rounded-full opacity-70', STAT_TONE[tone].blob)}
        aria-hidden
      />
      <strong className={cn('relative text-[1.9rem] font-bold leading-tight', STAT_TONE[tone].value)}>{value}</strong>
      <span className="relative text-sm text-muted-foreground">{label}</span>
    </>
  );
  const className =
    'relative flex flex-col gap-0.5 overflow-hidden rounded-lg border bg-card px-4 py-4 text-card-foreground shadow-soft sm:px-[1.125rem]';
  return to ? (
    <Link
      to={to}
      className={cn(className, 'transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="mb-1">{title}</h2>
      {children && <p className="m-0 text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4';

/** Automatic match ideas; saving one turns it into a proposal and drops it from the list. */
function Suggestions({ onCreated }: { onCreated: (p: Proposal) => void }) {
  const suggestions = useAsync(() => api.suggestions(undefined, 6), []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const items = (suggestions.data ?? []).filter((s) => !hidden.has(s.single._id + s.candidate._id));
  if (suggestions.loading && !suggestions.data) return <Spinner label="מחפשים התאמות…" />;
  if (suggestions.error) return <ErrorBox message={suggestions.error} onRetry={suggestions.reload} />;
  return (
    <section className="mb-7">
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <SectionHead title="הצעות אוטומטיות">
          זוגות שמתאימים לפי המגזר והגיל שכל צד ביקש, תחומי עניין ועיר. כוללות מועמדים מהמאגר המשותף.
        </SectionHead>
        <Link to="/brainstorm" className={cn(buttonVariants({ variant: 'soft', size: 'sm' }), 'mb-3')}>
          <Shuffle aria-hidden />
          לסיעור מוחות
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground">אין כרגע הצעות חדשות. כשיתווספו מועמדים, יופיעו כאן התאמות.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {items.map((s) => (
            <SuggestionCard
              key={s.single._id + s.candidate._id}
              suggestion={s}
              onCreated={(p) => {
                setHidden(new Set(hidden).add(s.single._id + s.candidate._id));
                onCreated(p);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const me = useMe();
  const singles = useAsync(() => api.mySingles(me._id), [me._id]);
  const requests = useAsync(() => api.requests(), []);
  const proposals = useAsync(() => api.proposals(), []);
  const [adding, setAdding] = useState(false);
  const [openProposal, setOpenProposal] = useState<Proposal | null>(null);
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');

  const list = useMemo(
    () =>
      (singles.data ?? [])
        .filter((s) => !gender || s.gender === gender)
        .filter((s) => matchesQuery(query, s.firstName, s.lastName, s.city, s.currentOccupation, ...s.sectors))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [singles.data, query, gender]
  );

  const pendingIncoming = requests.data?.incoming.filter((r) => r.status === 'pending').length ?? 0;
  const total = singles.data?.length ?? 0;
  const publicCount = singles.data?.filter((s) => s.isPublic).length ?? 0;
  const allProposals = proposals.data ?? [];
  const openCount = allProposals.filter((p) => OPEN.includes(p.status)).length;
  const datingCount = allProposals.filter((p) => p.status === 'dating' || p.status === 'engaged').length;
  const marriedCount = allProposals.filter((p) => p.status === 'married').length;
  const followUp = allProposals.filter((p) => isStale(p)).slice(0, 3);
  const upsert = (p: Proposal) =>
    proposals.setData([p, ...allProposals.filter((x) => x._id !== p._id)]);

  return (
    <div>
      <PageHeader
        title={<>שלום, {me.firstName}</>}
        subtitle={
          <>
            {total} מועמדים · {publicCount} במאגר המשותף
          </>
        }
      >
        {pendingIncoming > 0 && (
          <Link to="/requests" className={buttonVariants({ variant: 'outline' })}>
            בקשות ממתינות <Badge tone="accent">{pendingIncoming}</Badge>
          </Link>
        )}
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          הוספת מועמד/ת
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={total} label="מועמדים פעילים" />
        <Stat value={openCount} label="הצעות פתוחות" to="/proposals" />
        <Stat value={datingCount} label="נפגשים או מאורסים" to="/proposals" tone="secondary" />
        <Stat value={marriedCount} label="זוגות שהתחתנו" to="/couples" tone="gold" />
      </div>

      {followUp.length > 0 && (
        <section className="mb-7">
          <SectionHead title="מחכות לעדכון">הצעות פתוחות שלא זזו כבר שבוע</SectionHead>
          <div className={GRID}>
            {followUp.map((p) => (
              <ProposalCard key={p._id} proposal={p} onOpen={() => setOpenProposal(p)} />
            ))}
          </div>
        </section>
      )}

      <Suggestions onCreated={upsert} />

      <h2 className="mb-0 mt-2">המועמדים שלי</h2>

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          className="sm:min-w-[220px] sm:flex-1"
          type="search"
          placeholder="חיפוש לפי שם, עיר, מגזר או עיסוק"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש"
        />
        <div className="flex gap-1 rounded-md bg-muted p-1 sm:inline-flex" role="group" aria-label="סינון לפי מגדר">
          {[
            ['', 'כולם'],
            ['נקבה', 'בנות'],
            ['זכר', 'בנים'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={gender === value}
              onClick={() => setGender(value)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-sm px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
                gender === value && 'bg-card font-semibold text-foreground shadow-sm'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {singles.loading && !singles.data ? (
        <Spinner />
      ) : singles.error ? (
        <ErrorBox message={singles.error} onRetry={singles.reload} />
      ) : total === 0 ? (
        <EmptyState title="עוד אין מועמדים">
          <p>שולחים למועמדים את השאלון, והם ממלאים אותו בעצמם. אפשר גם לאמץ מועמדים מהמאגר המשותף.</p>
          <ShareRegistration matchMakerId={me._id} compact />
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title="אין תוצאות לחיפוש" />
      ) : (
        <div className={GRID}>
          {list.map((s) => (
            <Link
              key={s._id}
              to={`/singles/${s._id}`}
              className="block rounded-lg text-inherit no-underline transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>*]:h-full [&>*]:transition-shadow hover:[&>*]:shadow-lift"
            >
              <SingleCard
                single={s}
                footer={
                  <div className="flex flex-wrap gap-1.5">
                    {s.isPublic ? <Badge tone="ok">במאגר המשותף</Badge> : <Badge>פרטי</Badge>}
                    {s.matchMakers.length > 1 && <Badge tone="accent">{s.matchMakers.length} שדכנים</Badge>}
                  </div>
                }
              />
            </Link>
          ))}
        </div>
      )}

      {adding && <AddSingleDialog matchMakerId={me._id} onClose={() => setAdding(false)} />}
      {openProposal && (
        <ProposalDialog
          proposal={openProposal}
          onClose={() => setOpenProposal(null)}
          onChange={upsert}
          onDelete={(id) => proposals.setData(allProposals.filter((x) => x._id !== id))}
        />
      )}
    </div>
  );
}
