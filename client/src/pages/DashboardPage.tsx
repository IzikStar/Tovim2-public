import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { SingleCard } from '../components/SingleCard';
import { Badge, EmptyState, ErrorBox, Spinner } from '../components/ui';
import { matchesQuery } from '../lib/format';
import { useAsync } from '../lib/useAsync';

function RegistrationLink({ matchMakerId }: { matchMakerId: string }) {
  const url = `${window.location.origin}/register/${matchMakerId}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('העתיקו את הקישור:', url);
    }
  };
  return (
    <div className="reglink card">
      <div>
        <strong>קישור ההרשמה שלך</strong>
        <p>שולחים למועמד/ת, והם ממלאים את השאלון בעצמם. הכרטיס מגיע ישר לרשימה שלך.</p>
      </div>
      <div className="reglink__row">
        <code dir="ltr" className="reglink__url">
          {url}
        </code>
        <button type="button" className="btn btn--primary btn--sm" onClick={copy}>
          {copied ? 'הועתק ✓' : 'העתקה'}
        </button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const me = useMe();
  const singles = useAsync(() => api.mySingles(me._id), [me._id]);
  const requests = useAsync(() => api.requests(), []);
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');

  const list = useMemo(
    () =>
      (singles.data ?? [])
        .filter((s) => !gender || s.gender === gender)
        .filter((s) => matchesQuery(query, s.firstName, s.lastName, s.city, s.sector, s.currentOccupation))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [singles.data, query, gender]
  );

  const pendingIncoming = requests.data?.incoming.filter((r) => r.status === 'pending').length ?? 0;
  const total = singles.data?.length ?? 0;
  const publicCount = singles.data?.filter((s) => s.isPublic).length ?? 0;

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>המועמדים שלי</h1>
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
          <Link to="/singles/new" className="btn btn--primary">
            + מועמד/ת חדש/ה
          </Link>
        </div>
      </div>

      <RegistrationLink matchMakerId={me._id} />

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
          <p>אפשר להוסיף מועמד/ת ידנית, לשלוח את קישור ההרשמה, או לאמץ מועמדים מהמאגר המשותף.</p>
          <Link to="/singles/new" className="btn btn--primary">
            הוספת מועמד/ת
          </Link>
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
    </div>
  );
}
