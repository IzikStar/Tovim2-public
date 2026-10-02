import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type {
  Proposal,
  ProposalPerson,
  ProposalStatus,
  ProposalUpdate,
  Single,
  SideResponse,
  Suggestion,
  SuggestionPerson,
} from '../api/types';
import { SIDE_RESPONSES } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { formatDate, matchesQuery, sectorLabel } from '../lib/format';
import {
  BOARD,
  RESPONSE_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  isStale,
  lastActivity,
  orderedSides,
  personName,
  responseLabel,
  sinceLabel,
} from '../lib/proposals';
import { useAsync } from '../lib/useAsync';
import { Avatar, Badge, ErrorBox, Field, Modal, Spinner } from './ui';

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

function PersonLine({ person }: { person: ProposalPerson | SuggestionPerson | null }) {
  if (!person) return <span className="muted">מועמד/ת שנמחק/ה</span>;
  const age = person.age;
  const name = personName(person);
  return (
    <span className="person">
      <Avatar firstName={person.firstName} lastName={person.lastName} size={34} />
      <span className="person__text">
        {person.mine ? (
          <Link to={`/singles/${person._id}`} onClick={(e) => e.stopPropagation()}>
            {name}
          </Link>
        ) : (
          <strong>
            {name} <small className="muted">(מהמאגר)</small>
          </strong>
        )}
        <small className="muted">
          {age} · {person.city} · {sectorLabel(person)}
        </small>
      </span>
    </span>
  );
}

/** A compact card for the board and for a single's profile. */
export function ProposalCard({ proposal, onOpen }: { proposal: Proposal; onOpen: () => void }) {
  const sides = orderedSides(proposal);
  const stale = isStale(proposal);
  return (
    <button type="button" className={`proposal card${stale ? ' proposal--stale' : ''}`} onClick={onOpen}>
      <div className="proposal__top">
        <StatusBadge status={proposal.status} />
        <small className="muted">{sinceLabel(lastActivity(proposal))}</small>
      </div>
      {sides.map((side, i) => (
        <div key={side.single?._id ?? i} className="proposal__side">
          <PersonLine person={side.single} />
          {proposal.status !== 'idea' && (
            <Badge tone={RESPONSE_TONE[side.response]}>{responseLabel(side.response, side.single?.gender)}</Badge>
          )}
        </div>
      ))}
      {proposal.status === 'dating' && proposal.datesCount > 0 && (
        <small className="muted">{proposal.datesCount} פגישות</small>
      )}
      {stale && <small className="proposal__nudge">לא היה עדכון כבר שבוע. כדאי לבדוק מה קורה</small>}
    </button>
  );
}

/** Full view of one proposal: move it along, record each side's answer, notes and history. */
export function ProposalDialog({
  proposal,
  onClose,
  onChange,
  onDelete,
}: {
  proposal: Proposal;
  onClose: () => void;
  onChange: (p: Proposal) => void;
  onDelete: (id: string) => void;
}) {
  const sides = orderedSides(proposal);
  const [status, setStatus] = useState<ProposalStatus>(proposal.status);
  const [statusNote, setStatusNote] = useState('');
  const [responses, setResponses] = useState(
    Object.fromEntries(sides.map((s) => [s.single?._id ?? '', { response: s.response, note: s.note ?? '' }]))
  );
  const [notes, setNotes] = useState(proposal.notes ?? '');
  const [datesCount, setDatesCount] = useState(String(proposal.datesCount ?? 0));
  const [closeReason, setCloseReason] = useState(proposal.closeReason ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const update: ProposalUpdate = {
      notes,
      datesCount: Math.max(0, Number(datesCount) || 0),
      closeReason,
      sides: sides
        .filter((s) => s.single)
        .map((s) => ({ single: s.single!._id, ...responses[s.single!._id] })),
    };
    if (status !== proposal.status) {
      update.status = status;
      if (statusNote.trim()) update.statusNote = statusNote.trim();
    }
    try {
      onChange(await api.updateProposal(proposal._id, update));
      onClose();
    } catch (err) {
      setError(errorText(err, 'השמירה נכשלה'));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('למחוק את ההצעה? ההיסטוריה שלה תימחק.')) return;
    try {
      await api.deleteProposal(proposal._id);
      onDelete(proposal._id);
      onClose();
    } catch (err) {
      setError(errorText(err, 'המחיקה נכשלה'));
    }
  };

  return (
    <Modal title="מעקב הצעה" onClose={onClose} wide>
      <div className="stack">
        <div className="field">
          <span className="field__label">איפה זה עומד</span>
          <div className="steps" role="radiogroup" aria-label="סטטוס">
            {BOARD.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                className={`steps__item steps__item--${s}${status === s ? ' on' : ''}`}
                onClick={() => setStatus(s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {status !== proposal.status && (
            <input
              placeholder="הערה לשינוי (לא חובה), למשל: נפגשו בפעם הראשונה"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          )}
          {status === 'married' && proposal.status !== 'married' && (
            <small className="field__hint">מזל טוב! שני הצדדים יעברו לעמוד הזוגות ויוסרו מהרשימות ומהמאגר.</small>
          )}
        </div>

        <div className="sides">
          {sides.map((side) => {
            const id = side.single?._id ?? '';
            const value = responses[id];
            return (
              <div key={id} className="side card">
                <PersonLine person={side.single} />
                {side.single && (
                  <>
                    <div className="chips" role="radiogroup" aria-label={`מה ${side.single.firstName} חשב/ה`}>
                      {SIDE_RESPONSES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          role="radio"
                          aria-checked={value.response === r}
                          className={`chip${value.response === r ? ' chip--on' : ''}`}
                          onClick={() => setResponses({ ...responses, [id]: { ...value, response: r as SideResponse } })}
                        >
                          {responseLabel(r as SideResponse, side.single!.gender)}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      placeholder={`מה ${side.single.firstName} ${side.single.gender === 'נקבה' ? 'אמרה' : 'אמר'}?`}
                      value={value.note}
                      onChange={(e) => setResponses({ ...responses, [id]: { ...value, note: e.target.value } })}
                    />
                    {side.respondedAt && <small className="muted">עודכן {formatDate(side.respondedAt)}</small>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="form-grid">
          {(status === 'dating' || status === 'engaged' || proposal.datesCount > 0) && (
            <Field label="מספר פגישות">
              {(id) => (
                <input id={id} type="number" min={0} inputMode="numeric" value={datesCount} onChange={(e) => setDatesCount(e.target.value)} />
              )}
            </Field>
          )}
          {status === 'closed' && (
            <Field label="למה נסגר">
              {(id) => <input id={id} value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="למשל: לא התאים לה הגיל" />}
            </Field>
          )}
          <Field label="רשימות" wide>
            {(id) => <textarea id={id} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="רעיונות, מה לברר, עם מי לדבר…" />}
          </Field>
        </div>

        <div>
          <h3>היסטוריה</h3>
          <ol className="timeline">
            {[...proposal.history].reverse().map((h, i) => (
              <li key={i}>
                <StatusBadge status={h.status} />
                <span className="muted">{formatDate(h.at)}</span>
                {h.note && <span>{h.note}</span>}
              </li>
            ))}
          </ol>
        </div>

        {error && <ErrorBox message={error} />}
        <div className="modal__actions modal__actions--split">
          <button type="button" className="btn btn--danger-ghost" onClick={remove}>
            מחיקה
          </button>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              ביטול
            </button>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>
              {busy ? 'שומרים…' : 'שמירה'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** One automatic suggestion with buttons to save it as an idea or mark it proposed. */
export function SuggestionCard({ suggestion, onCreated }: { suggestion: Suggestion; onCreated: (p: Proposal) => void }) {
  const [busy, setBusy] = useState<ProposalStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = async (status: ProposalStatus) => {
    setBusy(status);
    setError(null);
    try {
      onCreated(await api.createProposal([suggestion.single._id, suggestion.candidate._id], status));
    } catch (err) {
      setError(errorText(err, 'השמירה נכשלה'));
      setBusy(null);
    }
  };
  return (
    <article className="card suggestion">
      <div className="suggestion__score" title="ציון התאמה">
        {suggestion.score}
        <small>%</small>
      </div>
      <PersonLine person={suggestion.single} />
      <PersonLine person={suggestion.candidate} />
      {suggestion.reasons.length > 0 && (
        <ul className="suggestion__reasons">
          {suggestion.reasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {error && <ErrorBox message={error} />}
      <div className="suggestion__actions">
        <button type="button" className="btn btn--ghost btn--sm" disabled={!!busy} onClick={() => create('idea')}>
          {busy === 'idea' ? 'שומרים…' : 'שמירה כרעיון'}
        </button>
        <button type="button" className="btn btn--primary btn--sm" disabled={!!busy} onClick={() => create('proposed')}>
          {busy === 'proposed' ? 'שומרים…' : 'הצעתי להם'}
        </button>
      </div>
    </article>
  );
}

/** Pick the other side for a new proposal with a given single: own singles and the pool. */
export function NewProposalDialog({
  single,
  onClose,
  onCreated,
}: {
  single: Single;
  onClose: () => void;
  onCreated: (p: Proposal) => void;
}) {
  const me = useMe();
  const data = useAsync(
    () => Promise.all([api.mySingles(me._id), api.publicSingles(), api.suggestions(single._id, 5)]),
    [me._id, single._id]
  );
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('');
  const [status, setStatus] = useState<ProposalStatus>('idea');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => {
    if (!data.data) return [];
    const [mine, pool, suggestions] = data.data;
    const scores = new Map(suggestions.map((s) => [s.candidate._id, s.score]));
    const own = mine.map((s) => ({ ...s, mine: true }));
    const ownIds = new Set(own.map((s) => s._id));
    const all = [...own, ...pool.filter((s) => !ownIds.has(s._id)).map((s) => ({ ...s, lastName: undefined, mine: false }))];
    return all
      .filter((s) => s._id !== single._id && s.gender !== single.gender)
      .filter((s) => matchesQuery(query, s.firstName, s.lastName, s.city, ...s.sectors))
      .map((s) => ({ ...s, score: scores.get(s._id) }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [data.data, query, single]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      onCreated(await api.createProposal([single._id, picked], status, notes || undefined));
    } catch (err) {
      setError(errorText(err, 'השמירה נכשלה'));
      setBusy(false);
    }
  };

  return (
    <Modal title={`הצעה חדשה ל${single.firstName}`} onClose={onClose} wide>
      <input type="search" placeholder="חיפוש לפי שם, עיר או מגזר" value={query} onChange={(e) => setQuery(e.target.value)} />
      {data.loading ? (
        <Spinner />
      ) : data.error ? (
        <ErrorBox message={data.error} onRetry={data.reload} />
      ) : options.length === 0 ? (
        <p className="muted">אין מועמדים מתאימים ברשימה שלך או במאגר.</p>
      ) : (
        <ul className="pick-list pick-list--scroll" role="listbox" aria-label="בחירת הצד השני">
          {options.map((s) => (
            <li key={s._id}>
              <button
                type="button"
                role="option"
                aria-selected={picked === s._id}
                className={`pick${picked === s._id ? ' pick--on' : ''}`}
                onClick={() => setPicked(s._id)}
              >
                <Avatar firstName={s.firstName} lastName={s.lastName} size={40} />
                <span>
                  <strong>
                    {s.firstName} {s.lastName}
                    {!s.mine && <small className="muted"> (מהמאגר)</small>}
                  </strong>
                  <small>
                    {s.age} · {s.city} · {sectorLabel(s)}
                  </small>
                </span>
                {s.score !== undefined && <Badge tone="ok">התאמה {s.score}%</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="form-grid">
        <Field label="שלב">
          {(id) => (
            <select id={id} value={status} onChange={(e) => setStatus(e.target.value as ProposalStatus)}>
              <option value="idea">רעיון בלבד</option>
              <option value="proposed">כבר הצעתי</option>
            </select>
          )}
        </Field>
        <Field label="הערה">
          {(id) => <input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="modal__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          ביטול
        </button>
        <button type="button" className="btn btn--primary" disabled={!picked || busy} onClick={create}>
          {busy ? 'שומרים…' : 'יצירת הצעה'}
        </button>
      </div>
    </Modal>
  );
}
