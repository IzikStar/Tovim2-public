import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import type { Proposal } from '../api/types';
import { AddSingleDialog, ShareRegistration } from '../components/AddSingleDialog';
import { ProposalCard, ProposalDialog, SuggestionCard } from '../components/proposals';
import { SingleCard } from '../components/SingleCard';
import { Badge, EmptyState, ErrorBox, Spinner } from '../components/ui';
import { matchesQuery } from '../lib/format';
import { OPEN, isStale } from '../lib/proposals';
import { useAsync } from '../lib/useAsync';

function Stat({ value, label, to }: { value: number | string; label: string; to?: string }) {
  const body = (
    <>
      <strong className="stat__value">{value}</strong>
      <span className="stat__label">{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className="stat card">
      {body}
    </Link>
  ) : (
    <div className="stat card">{body}</div>
  );
}

/** Automatic match ideas; saving one turns it into a proposal and drops it from the list. */
function Suggestions({ onCreated }: { onCreated: (p: Proposal) => void }) {
  const suggestions = useAsync(() => api.suggestions(undefined, 6), []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const items = (suggestions.data ?? []).filter((s) => !hidden.has(s.single._id + s.candidate._id));
  if (suggestions.loading && !suggestions.data) return <Spinner label="מחפשים התאמות…" />;
  if (suggestions.error) return <ErrorBox message={suggestions.error} onRetry={suggestions.reload} />;
  return (
    <section className="section">
      <div className="section__head">
        <h2>הצעות אוטומטיות</h2>
        <p className="muted">זוגות שמתאימים לפי המגזר והגיל שכל צד ביקש, תחומי עניין ועיר. כוללות מועמדים מהמאגר המשותף.</p>
      </div>
      {items.length === 0 ? (
        <p className="muted">אין כרגע הצעות חדשות. כשיתווספו מועמדים, יופיעו כאן התאמות.</p>
      ) : (
        <div className="grid grid--suggestions">
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
    <div className="page">
      <div className="page__head">
        <div>
          <h1>שלום, {me.firstName}</h1>
          <p className="muted">
            {total} מועמדים · {publicCount} במאגר המשותף
          </p>
        </div>
        <div className="page__actions">
          {pendingIncoming > 0 && (
            <Link to="/requests" className="btn btn--ghost">
              בקשות ממתינות <Badge tone="accent">{pendingIncoming}</Badge>
            </Link>
          )}
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            + הוספת מועמד/ת
          </button>
        </div>
      </div>

      <div className="stats">
        <Stat value={total} label="מועמדים פעילים" />
        <Stat value={openCount} label="הצעות פתוחות" to="/proposals" />
        <Stat value={datingCount} label="נפגשים או מאורסים" to="/proposals" />
        <Stat value={marriedCount} label="זוגות שהתחתנו" to="/couples" />
      </div>

      {followUp.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>מחכות לעדכון</h2>
            <p className="muted">הצעות פתוחות שלא זזו כבר שבוע</p>
          </div>
          <div className="grid">
            {followUp.map((p) => (
              <ProposalCard key={p._id} proposal={p} onOpen={() => setOpenProposal(p)} />
            ))}
          </div>
        </section>
      )}

      <Suggestions onCreated={upsert} />

      <div className="section__head section__head--list">
        <h2>המועמדים שלי</h2>
      </div>

      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          placeholder="חיפוש לפי שם, עיר, מגזר או עיסוק"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש"
        />
        <div className="segmented" role="group" aria-label="סינון לפי מגדר">
          {[
            ['', 'כולם'],
            ['נקבה', 'בנות'],
            ['זכר', 'בנים'],
          ].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)}>
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
        <div className="grid">
          {list.map((s) => (
            <Link key={s._id} to={`/singles/${s._id}`} className="card-link">
              <SingleCard
                single={s}
                footer={
                  <div className="single-card__flags">
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
