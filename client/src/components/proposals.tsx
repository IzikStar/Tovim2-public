import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Trash2, TriangleAlert } from 'lucide-react';
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
import { cn } from '../lib/utils';
import { Avatar, Badge, ErrorBox, Field, Modal, Spinner } from './ui';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

function PersonLine({ person }: { person: ProposalPerson | SuggestionPerson | null }) {
  if (!person) return <span className="text-sm text-muted-foreground">מועמד/ת שנמחק/ה</span>;
  const age = person.age;
  const name = personName(person);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar firstName={person.firstName} lastName={person.lastName} size={34} />
      <span className="flex min-w-0 flex-col leading-snug">
        {person.mine ? (
          <Link
            to={`/singles/${person._id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-semibold text-primary hover:underline"
          >
            {name}
          </Link>
        ) : (
          <strong className="truncate font-semibold">
            {name} <small className="text-xs font-medium text-muted-foreground">(מהמאגר)</small>
          </strong>
        )}
        <small className="truncate text-[0.8125rem] text-muted-foreground">
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
    <button
      type="button"
      data-stale={stale || undefined}
      className={cn(
        'flex w-full flex-col gap-2.5 rounded-lg border bg-card p-3.5 text-start text-card-foreground shadow-soft transition',
        'hover:-translate-y-px hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        stale && 'border-warning/40'
      )}
      onClick={onOpen}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={proposal.status} />
        <small className="text-xs text-muted-foreground">{sinceLabel(lastActivity(proposal))}</small>
      </div>
      {sides.map((side, i) => (
        <div key={side.single?._id ?? i} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="min-w-0 flex-1 basis-40">
            <PersonLine person={side.single} />
          </span>
          {proposal.status !== 'idea' && (
            <span className="ms-11">
              <Badge tone={RESPONSE_TONE[side.response]}>{responseLabel(side.response, side.single?.gender)}</Badge>
            </span>
          )}
        </div>
      ))}
      {proposal.status === 'dating' && proposal.datesCount > 0 && (
        <small className="text-xs text-muted-foreground">{proposal.datesCount} פגישות</small>
      )}
      {stale && <small className="text-xs font-medium text-warning">לא היה עדכון כבר שבוע. כדאי לבדוק מה קורה</small>}
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
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">איפה זה עומד</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-6" role="radiogroup" aria-label="סטטוס">
            {BOARD.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                data-status={s}
                className={cn(
                  'rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  status === s && 'font-semibold text-primary-foreground shadow-sm hover:text-primary-foreground',
                  status === s &&
                    (s === 'engaged' || s === 'married'
                      ? 'bg-secondary hover:bg-secondary'
                      : s === 'closed'
                        ? 'bg-destructive hover:bg-destructive'
                        : 'bg-primary hover:bg-primary')
                )}
                onClick={() => setStatus(s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {status !== proposal.status && (
            <Input
              placeholder="הערה לשינוי (לא חובה), למשל: נפגשו בפעם הראשונה"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          )}
          {status === 'married' && proposal.status !== 'married' && (
            <small className="text-xs text-muted-foreground">מזל טוב! שני הצדדים יעברו לעמוד הזוגות ויוסרו מהרשימות ומהמאגר.</small>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sides.map((side) => {
            const id = side.single?._id ?? '';
            const value = responses[id];
            return (
              <div key={id} className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-3.5">
                <PersonLine person={side.single} />
                {side.single && (
                  <>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`מה ${side.single.firstName} חשב/ה`}>
                      {SIDE_RESPONSES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          role="radio"
                          aria-checked={value.response === r}
                          className={cn(
                            'rounded-full border px-3 py-1 text-[0.8125rem] transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            value.response === r ? 'border-primary/30 bg-primary-soft font-medium text-primary' : 'bg-card'
                          )}
                          onClick={() => setResponses({ ...responses, [id]: { ...value, response: r as SideResponse } })}
                        >
                          {responseLabel(r as SideResponse, side.single!.gender)}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={2}
                      className="min-h-0"
                      placeholder={`מה ${side.single.firstName} ${side.single.gender === 'נקבה' ? 'אמרה' : 'אמר'}?`}
                      value={value.note}
                      onChange={(e) => setResponses({ ...responses, [id]: { ...value, note: e.target.value } })}
                    />
                    {side.respondedAt && <small className="text-xs text-muted-foreground">עודכן {formatDate(side.respondedAt)}</small>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(status === 'dating' || status === 'engaged' || proposal.datesCount > 0) && (
            <Field label="מספר פגישות">
              {(id) => (
                <Input id={id} type="number" min={0} inputMode="numeric" value={datesCount} onChange={(e) => setDatesCount(e.target.value)} />
              )}
            </Field>
          )}
          {status === 'closed' && (
            <Field label="למה נסגר">
              {(id) => <Input id={id} value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="למשל: לא התאים לה הגיל" />}
            </Field>
          )}
          <Field label="רשימות" wide>
            {(id) => <Textarea id={id} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="רעיונות, מה לברר, עם מי לדבר…" />}
          </Field>
        </div>

        <div>
          <h3 className="mb-3">היסטוריה</h3>
          <ol className="m-0 flex list-none flex-col gap-2.5 border-s-2 p-0 ps-4">
            {[...proposal.history].reverse().map((h, i) => (
              <li
                key={i}
                className="relative flex flex-wrap items-center gap-2 text-sm before:absolute before:-start-[1.4rem] before:top-1.5 before:size-2.5 before:rounded-full before:border-2 before:border-primary before:bg-card before:content-['']"
              >
                <StatusBadge status={h.status} />
                <span className="text-muted-foreground">{formatDate(h.at)}</span>
                {h.note && <span>{h.note}</span>}
              </li>
            ))}
          </ol>
        </div>

        {error && <ErrorBox message={error} />}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button variant="destructive-ghost" onClick={remove}>
            <Trash2 aria-hidden />
            מחיקה
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button disabled={busy} onClick={save}>
              {busy ? 'שומרים…' : 'שמירה'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** One automatic suggestion with buttons to save it as an idea or mark it proposed. */
export function SuggestionCard({
  suggestion,
  onCreated,
  onDismiss,
}: {
  suggestion: Suggestion & { stretches?: string[]; note?: string };
  onCreated: (p: Proposal) => void;
  /** Shows a "not this time" button (brainstorm mode) */
  onDismiss?: () => void;
}) {
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
    <Card className="relative flex flex-col gap-3 bg-gradient-to-b from-card from-60% to-primary-soft/40 p-5 pt-4">
      <div
        className="absolute end-4 top-3.5 rounded-full bg-success-soft px-2.5 py-0.5 text-lg font-bold leading-snug text-success"
        title="ציון התאמה"
      >
        <span dir="ltr">
          {suggestion.score}
          <small className="text-xs">%</small>
        </span>
      </div>
      <div className="min-w-0 pe-16">
        <PersonLine person={suggestion.single} />
      </div>
      <PersonLine person={suggestion.candidate} />
      {suggestion.note && (
        <p className="m-0 flex items-center gap-1.5 text-sm font-medium text-primary">
          <Lightbulb className="size-4 shrink-0" aria-hidden />
          {suggestion.note}
        </p>
      )}
      {suggestion.reasons.length > 0 && (
        <ul className="m-0 list-disc space-y-0.5 ps-5 text-sm text-foreground/80 marker:text-primary/60">
          {suggestion.reasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {suggestion.stretches && suggestion.stretches.length > 0 && (
        <ul className="m-0 space-y-0.5 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          {suggestion.stretches.map((r) => (
            <li key={r} className="flex items-start gap-1.5">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}
      {error && <ErrorBox message={error} />}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => create('idea')}>
          {busy === 'idea' ? 'שומרים…' : 'שמירה כרעיון'}
        </Button>
        <Button size="sm" disabled={!!busy} onClick={() => create('proposed')}>
          {busy === 'proposed' ? 'שומרים…' : 'הצעתי להם'}
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="sm" className="ms-auto text-muted-foreground" disabled={!!busy} onClick={onDismiss}>
            לא הפעם
          </Button>
        )}
      </div>
    </Card>
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
      <Input type="search" placeholder="חיפוש לפי שם, עיר או מגזר" value={query} onChange={(e) => setQuery(e.target.value)} />
      {data.loading ? (
        <Spinner />
      ) : data.error ? (
        <ErrorBox message={data.error} onRetry={data.reload} />
      ) : options.length === 0 ? (
        <p className="my-4 text-muted-foreground">אין מועמדים מתאימים ברשימה שלך או במאגר.</p>
      ) : (
        <ul className="my-3 flex max-h-80 list-none flex-col gap-1.5 overflow-y-auto p-0" role="listbox" aria-label="בחירת הצד השני">
          {options.map((s) => (
            <li key={s._id}>
              <button
                type="button"
                role="option"
                aria-selected={picked === s._id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border bg-card p-2.5 text-start transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  picked === s._id && 'border-primary bg-primary-soft'
                )}
                onClick={() => setPicked(s._id)}
              >
                <Avatar firstName={s.firstName} lastName={s.lastName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col leading-snug">
                  <strong className="truncate font-semibold">
                    {s.firstName} {s.lastName}
                    {!s.mine && <small className="text-xs font-medium text-muted-foreground"> (מהמאגר)</small>}
                  </strong>
                  <small className="truncate text-[0.8125rem] text-muted-foreground">
                    {s.age} · {s.city} · {sectorLabel(s)}
                  </small>
                </span>
                {s.score !== undefined && <Badge tone="ok">התאמה <bdi>{s.score}%</bdi></Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="שלב">
          {(id) => (
            <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as ProposalStatus)}>
              <option value="idea">רעיון בלבד</option>
              <option value="proposed">כבר הצעתי</option>
            </Select>
          )}
        </Field>
        <Field label="הערה">
          {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          ביטול
        </Button>
        <Button disabled={!picked || busy} onClick={create}>
          {busy ? 'שומרים…' : 'יצירת הצעה'}
        </Button>
      </div>
    </Modal>
  );
}
