import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { Proposal, Single } from '../api/types';
import { NewProposalDialog, ProposalCard, ProposalDialog, SuggestionCard } from '../components/proposals';
import { useMe } from '../auth/AuthContext';
import { Avatar, Badge, ErrorBox, Modal, Spinner } from '../components/ui';
import { Button, buttonVariants } from '../components/ui/button';
import { Badge as Tag } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { ethnicityLabel, formatDate, genderize, sectorLabel } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const sectionCard = 'rounded-lg border bg-card p-5 text-card-foreground shadow-soft';

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children === undefined || children === null || children === '' || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-dashed py-2 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Row label={label}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <Tag key={t} variant="neutral" className="whitespace-normal rounded-md px-2.5 py-1 text-[0.8125rem] font-medium text-foreground/80">
            {t}
          </Tag>
        ))}
      </div>
    </Row>
  );
}

function TransferDialog({ single, onClose, onSent }: { single: Single; onClose: () => void; onSent: () => void }) {
  const me = useMe();
  const others = useAsync(() => api.otherMatchMakers(me._id), [me._id]);
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const candidates = (others.data ?? []).filter((m) => !single.matchMakers.includes(m._id));

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.sendRequest(single._id, to);
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'השליחה נכשלה');
      setBusy(false);
    }
  };

  return (
    <Modal title={`שיתוף ${single.firstName} עם שדכן/ית`} onClose={onClose}>
      <p className="text-muted-foreground">
        השדכן/ית יקבלו בקשה. אם יאשרו, הם יוכלו לראות את הכרטיס המלא ולטפל ב{single.firstName} יחד איתך.
      </p>
      {others.loading ? (
        <Spinner />
      ) : others.error ? (
        <ErrorBox message={others.error} onRetry={others.reload} />
      ) : candidates.length === 0 ? (
        <p>{others.data?.length ? `כל השדכנים במערכת כבר מטפלים ב${single.firstName}.` : 'אין עוד שדכנים במערכת.'}</p>
      ) : (
        <ul className="my-2 flex list-none flex-col gap-1.5 p-0" role="listbox" aria-label="בחירת שדכן/ית">
          {candidates.map((m) => (
            <li key={m._id}>
              <button
                type="button"
                role="option"
                aria-selected={to === m._id}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-md border bg-card p-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  to === m._id && 'border-primary bg-primary-soft hover:bg-primary-soft'
                )}
                onClick={() => setTo(m._id)}
              >
                <Avatar firstName={m.firstName} lastName={m.lastName} size={40} />
                <span className="flex min-w-0 flex-col">
                  <strong className="font-semibold">
                    {m.firstName} {m.lastName}
                  </strong>
                  <small className="text-muted-foreground">
                    {m.city}
                    {m.expertSectors?.length ? ` · מתמחה ב: ${m.expertSectors.join(', ')}` : ''}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <ErrorBox message={error} />}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          ביטול
        </Button>
        <Button disabled={!to || busy} onClick={send}>
          {busy ? 'שולח…' : 'שליחת בקשה'}
        </Button>
      </div>
    </Modal>
  );
}

/** This single's proposals, plus automatic ideas for them. */
function ProposalsSection({ single }: { single: Single }) {
  const proposals = useAsync(() => api.proposals(single._id), [single._id]);
  const suggestions = useAsync(
    () => (single.isTaken ? Promise.resolve([]) : api.suggestions(single._id, 3)),
    [single._id, single.isTaken]
  );
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<Proposal | null>(null);
  const list = proposals.data ?? [];
  const upsert = (p: Proposal) => {
    proposals.setData([p, ...list.filter((x) => x._id !== p._id)]);
    suggestions.reload();
  };
  const { firstName } = single;

  return (
    <section className={sectionCard}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0">הצעות ל{firstName}</h2>
        {!single.isTaken && (
          <Button size="sm" onClick={() => setCreating(true)}>
            + הצעה חדשה
          </Button>
        )}
      </div>
      {proposals.loading && !proposals.data ? (
        <Spinner />
      ) : proposals.error ? (
        <ErrorBox message={proposals.error} onRetry={proposals.reload} />
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">עוד לא הוצע ל{firstName} אף אחד.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {list.map((p) => (
            <ProposalCard key={p._id} proposal={p} onOpen={() => setOpen(p)} />
          ))}
        </div>
      )}
      {!!suggestions.data?.length && (
        <>
          <h3 className="mb-2.5 mt-5 text-[0.98rem] text-muted-foreground">אולי יתאים/תתאים</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {suggestions.data.map((sug) => (
              <SuggestionCard key={sug.candidate._id} suggestion={sug} onCreated={upsert} />
            ))}
          </div>
        </>
      )}
      {creating && (
        <NewProposalDialog
          single={single}
          onClose={() => setCreating(false)}
          onCreated={(p) => {
            setCreating(false);
            upsert(p);
            setOpen(p);
          }}
        />
      )}
      {open && (
        <ProposalDialog
          proposal={open}
          onClose={() => setOpen(null)}
          onChange={upsert}
          onDelete={(id) => proposals.setData(list.filter((x) => x._id !== id))}
        />
      )}
    </section>
  );
}

export function SingleDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const single = useAsync(() => api.single(id), [id]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  if (single.loading) return <Spinner />;
  if (single.error || !single.data) {
    return (
      <div>
        <ErrorBox message={single.error ?? 'לא נמצא'} onRetry={single.reload} />
      </div>
    );
  }
  const s = single.data;
  const g = (v: string) => genderize(v, s.gender);

  const remove = async () => {
    if (!window.confirm(`למחוק את ${s.firstName} ${s.lastName}? אי אפשר לבטל את זה.`)) return;
    try {
      await api.deleteSingle(s._id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'המחיקה נכשלה');
    }
  };

  const toggleTaken = async () => {
    if (!s.isTaken && !window.confirm(`לסמן את ${s.firstName} כתפוס/ה? הכרטיס יעבור לעמוד הזוגות ויוסר מהמאגר.`)) return;
    try {
      single.setData(await api.updateSingle(s._id, { isTaken: !s.isTaken } as Partial<Single>));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'העדכון נכשל');
    }
  };

  const togglePublic = async () => {
    try {
      single.setData(await api.updateSingle(s._id, { isPublic: !s.isPublic }));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'העדכון נכשל');
    }
  };

  return (
    <div>
      <Link to="/dashboard" className="mb-3 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
        → חזרה לרשימה
      </Link>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={cn(sectionCard, 'flex flex-col items-center gap-2.5 text-center md:sticky md:top-[76px]')}>
          <div className="flex w-full flex-col items-center gap-2">
            {s.images.length ? (
              <img className="aspect-square w-full rounded-md object-cover" src={s.images[Math.min(imageIndex, s.images.length - 1)]} alt={`${s.firstName} ${s.lastName}`} />
            ) : (
              <Avatar firstName={s.firstName} lastName={s.lastName} size={160} />
            )}
            {s.images.length > 1 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {s.images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`תמונה ${i + 1}`}
                    className={cn(
                      'cursor-pointer rounded-[9px] border-2 border-transparent p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      i === imageIndex ? 'border-primary' : 'hover:border-border'
                    )}
                    onClick={() => setImageIndex(i)}
                  >
                    <img className="block size-12 rounded-md object-cover" src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="m-0 mt-1 break-words [overflow-wrap:anywhere]">
            {s.firstName} {s.lastName}
          </h1>
          <p className="m-0 text-muted-foreground">
            {s.age} · {s.city} · {g(s.marriageStatus)}
            {s.numOfChildren > 0 && ` · ${s.numOfChildren} ילדים`}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {s.isTaken ? (
              <Badge tone="accent">{s.gender === 'נקבה' ? 'תפוסה' : 'תפוס'} 💍</Badge>
            ) : s.isPublic ? (
              <Badge tone="ok">במאגר המשותף</Badge>
            ) : (
              <Badge>פרטי</Badge>
            )}
            {s.shareInWhatsappGroups && <Badge>מאשר/ת וואטסאפ</Badge>}
          </div>
          <dl className="my-1 w-full text-start">
            <Row label="טלפון">
              <a href={`tel:${s.phoneNumber}`} dir="ltr" className="text-primary hover:underline">
                {s.phoneNumber}
              </a>
            </Row>
            <Row label="אימייל">
              <a href={`mailto:${s.email}`} dir="ltr" className="text-primary hover:underline">
                {s.email}
              </a>
            </Row>
          </dl>
          <div className="mt-1.5 flex w-full flex-col gap-2">
            <Link to={`/singles/${s._id}/edit`} className={buttonVariants()}>
              עריכה
            </Link>
            <Button variant="outline" className="whitespace-normal" onClick={() => setTransferOpen(true)}>
              שיתוף עם שדכן/ית
            </Button>
            <Button variant="outline" className="whitespace-normal" onClick={togglePublic}>
              {s.isPublic ? 'הסרה מהמאגר המשותף' : 'הצגה במאגר המשותף'}
            </Button>
            <Button variant="outline" className="whitespace-normal" onClick={toggleTaken}>
              {s.isTaken ? 'החזרה לרשימה הפעילה' : 'סימון כתפוס/ה (התחתן/ה)'}
            </Button>
            <Button variant="destructive-ghost" onClick={remove}>
              מחיקה
            </Button>
          </div>
          {notice && (
            <div className="w-full rounded-md bg-success-soft px-3.5 py-2.5 text-start text-sm text-success" role="status">
              {notice}
            </div>
          )}
          <p className="m-0 text-xs text-muted-foreground">עודכן {formatDate(s.updatedAt)}</p>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <ProposalsSection single={s} />
          <section className={sectionCard}>
            <h2 className="mb-2">רקע</h2>
            <dl>
              <Row label="מגזר">{sectorLabel(s)}</Row>
              <Row label="מוצא">{ethnicityLabel(s)}</Row>
              <Row label="גובה">{s.height ? `${s.height} ס"מ` : undefined}</Row>
              <Row label="עיסוק">{s.currentOccupation}</Row>
              <Row label="לימודים ועבודה">{s.workAndStudyPlaces.join(' · ')}</Row>
            </dl>
          </section>

          <section className={sectionCard}>
            <h2 className="mb-2">{s.gender === 'נקבה' ? 'עליה' : 'עליו'}</h2>
            {s.basicDescription && <p className="mb-2 text-[1.05rem]">{s.basicDescription}</p>}
            {s.freeDescription && <p className="mb-2">{s.freeDescription}</p>}
            <dl>
              <TagRow label="תכונות" items={s.attributes} />
              <TagRow label="תחומי עניין" items={[...s.interests, ...s.otherInterests]} />
              <Row label="חזון">{s.futureVision}</Row>
            </dl>
          </section>

          <section className={sectionCard}>
            <h2 className="mb-2">מה {s.gender === 'נקבה' ? 'היא מחפשת' : 'הוא מחפש'}</h2>
            <dl>
              <Row label="אין פשרה על">
                <ol className="m-0 list-decimal ps-5">
                  {s.nonCompromisableAttributes.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </Row>
              <TagRow label="תכונות" items={s.lookingForAttributes} />
              <TagRow label="מגזרים" items={s.desiredSectors} />
              <Row label="גילאים">
                {s.desiredAgeRange && (s.desiredAgeRange.min || s.desiredAgeRange.max)
                  ? `${s.desiredAgeRange.min ?? '?'}–${s.desiredAgeRange.max ?? '?'}`
                  : undefined}
              </Row>
              <Row label="לא מתאים">{s.generalDealBreakers}</Row>
            </dl>
          </section>

          {(s.appearanceDescription || s.appearanceMustHave || s.appearanceMustNotHave) && (
            <section className={sectionCard}>
              <h2 className="mb-2">מראה</h2>
              <dl>
                <Row label="תיאור">{s.appearanceDescription}</Row>
                <Row label="חשוב שיהיה">{s.appearanceMustHave}</Row>
                <Row label="לא מתאים">{s.appearanceMustNotHave}</Row>
              </dl>
            </section>
          )}

          <section className={sectionCard}>
            <h2 className="mb-2">לשדכן/ית</h2>
            <dl>
              <Row label="סדר הצעה">{s.proposePreference}</Row>
              <Row label="שם לתפילה">{s.nameForPrayer}</Row>
              <Row label="ממליצים">
                {s.referencePhones.length ? (
                  <span dir="ltr">{s.referencePhones.join(', ')}</span>
                ) : undefined}
              </Row>
              <Row label="פרופיל קיים">{s.existingMatchProfile}</Row>
              <Row label="ציפיות">{s.matchmakerExpectations}</Row>
              <Row label="הגיע/ה דרך">{s.referralSource}</Row>
            </dl>
          </section>
        </div>
      </div>

      {transferOpen && (
        <TransferDialog
          single={s}
          onClose={() => setTransferOpen(false)}
          onSent={() => {
            setTransferOpen(false);
            setNotice('הבקשה נשלחה. אפשר לעקוב אחריה בעמוד הבקשות.');
          }}
        />
      )}
    </div>
  );
}
