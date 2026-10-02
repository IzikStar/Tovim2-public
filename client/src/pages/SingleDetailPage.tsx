import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { Single } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { Avatar, Badge, ErrorBox, Modal, Spinner } from '../components/ui';
import { ageFromBirthYear, ethnicityLabel, formatDate, genderize, sectorLabel } from '../lib/format';
import { useAsync } from '../lib/useAsync';

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children === undefined || children === null || children === '' || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="kv">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Row label={label}>
      <div className="chips">
        {items.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
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
      <p className="muted">
        השדכן/ית יקבלו בקשה. אם יאשרו, הם יוכלו לראות את הכרטיס המלא ולטפל ב{single.firstName} יחד איתך.
      </p>
      {others.loading ? (
        <Spinner />
      ) : others.error ? (
        <ErrorBox message={others.error} onRetry={others.reload} />
      ) : candidates.length === 0 ? (
        <p>{others.data?.length ? `כל השדכנים במערכת כבר מטפלים ב${single.firstName}.` : 'אין עוד שדכנים במערכת.'}</p>
      ) : (
        <ul className="pick-list" role="listbox" aria-label="בחירת שדכן/ית">
          {candidates.map((m) => (
            <li key={m._id}>
              <button
                type="button"
                role="option"
                aria-selected={to === m._id}
                className={`pick${to === m._id ? ' pick--on' : ''}`}
                onClick={() => setTo(m._id)}
              >
                <Avatar firstName={m.firstName} lastName={m.lastName} size={40} />
                <span>
                  <strong>
                    {m.firstName} {m.lastName}
                  </strong>
                  <small>
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
      <div className="modal__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          ביטול
        </button>
        <button type="button" className="btn btn--primary" disabled={!to || busy} onClick={send}>
          {busy ? 'שולח…' : 'שליחת בקשה'}
        </button>
      </div>
    </Modal>
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
      <div className="page">
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

  const togglePublic = async () => {
    try {
      single.setData(await api.updateSingle(s._id, { isPublic: !s.isPublic }));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'העדכון נכשל');
    }
  };

  return (
    <div className="page">
      <Link to="/dashboard" className="back">
        → חזרה לרשימה
      </Link>
      <div className="profile">
        <aside className="profile__side card">
          <div className="gallery">
            {s.images.length ? (
              <img className="gallery__main" src={s.images[Math.min(imageIndex, s.images.length - 1)]} alt={`${s.firstName} ${s.lastName}`} />
            ) : (
              <Avatar firstName={s.firstName} lastName={s.lastName} size={160} />
            )}
            {s.images.length > 1 && (
              <div className="gallery__thumbs">
                {s.images.map((src, i) => (
                  <button key={i} type="button" aria-label={`תמונה ${i + 1}`} className={i === imageIndex ? 'on' : ''} onClick={() => setImageIndex(i)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="profile__name">
            {s.firstName} {s.lastName}
          </h1>
          <p className="muted">
            {ageFromBirthYear(s.birthYear)} · {s.city} · {g(s.marriageStatus)}
            {s.numOfChildren > 0 && ` · ${s.numOfChildren} ילדים`}
          </p>
          <div className="single-card__flags">
            {s.isPublic ? <Badge tone="ok">במאגר המשותף</Badge> : <Badge>פרטי</Badge>}
            {s.shareInWhatsappGroups && <Badge>מאשר/ת וואטסאפ</Badge>}
          </div>
          <dl className="contact">
            <Row label="טלפון">
              <a href={`tel:${s.phoneNumber}`} dir="ltr">
                {s.phoneNumber}
              </a>
            </Row>
            <Row label="אימייל">
              <a href={`mailto:${s.email}`} dir="ltr">
                {s.email}
              </a>
            </Row>
          </dl>
          <div className="profile__actions">
            <Link to={`/singles/${s._id}/edit`} className="btn btn--primary">
              עריכה
            </Link>
            <button type="button" className="btn btn--ghost" onClick={() => setTransferOpen(true)}>
              שיתוף עם שדכן/ית
            </button>
            <button type="button" className="btn btn--ghost" onClick={togglePublic}>
              {s.isPublic ? 'הסרה מהמאגר המשותף' : 'הצגה במאגר המשותף'}
            </button>
            <button type="button" className="btn btn--danger-ghost" onClick={remove}>
              מחיקה
            </button>
          </div>
          {notice && <div className="alert alert--info">{notice}</div>}
          <p className="profile__updated">עודכן {formatDate(s.updatedAt)}</p>
        </aside>

        <div className="profile__main">
          <section className="card">
            <h2>רקע</h2>
            <dl>
              <Row label="מגזר">{sectorLabel(s)}</Row>
              <Row label="מוצא">{ethnicityLabel(s)}</Row>
              <Row label="גובה">{s.height ? `${s.height} ס"מ` : undefined}</Row>
              <Row label="עיסוק">{s.currentOccupation}</Row>
              <Row label="לימודים ועבודה">{s.workAndStudyPlaces.join(' · ')}</Row>
            </dl>
          </section>

          <section className="card">
            <h2>{s.gender === 'נקבה' ? 'עליה' : 'עליו'}</h2>
            {s.basicDescription && <p className="lead">{s.basicDescription}</p>}
            {s.freeDescription && <p>{s.freeDescription}</p>}
            <dl>
              <TagRow label="תכונות" items={s.attributes} />
              <TagRow label="תחומי עניין" items={[...s.interests, ...s.otherInterests]} />
              <Row label="חזון">{s.futureVision}</Row>
            </dl>
          </section>

          <section className="card">
            <h2>מה {s.gender === 'נקבה' ? 'היא מחפשת' : 'הוא מחפש'}</h2>
            <dl>
              <Row label="אין פשרה על">
                <ol className="nonneg">
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
            <section className="card">
              <h2>מראה</h2>
              <dl>
                <Row label="תיאור">{s.appearanceDescription}</Row>
                <Row label="חשוב שיהיה">{s.appearanceMustHave}</Row>
                <Row label="לא מתאים">{s.appearanceMustNotHave}</Row>
              </dl>
            </section>
          )}

          <section className="card">
            <h2>לשדכן/ית</h2>
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
