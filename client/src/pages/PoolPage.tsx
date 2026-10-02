import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { SECTORS } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { SingleCard } from '../components/SingleCard';
import { EmptyState, ErrorBox, Spinner } from '../components/ui';
import { matchesQuery } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function PoolPage() {
  const { me } = useAuth();
  const pool = useAsync(() => api.publicSingles(), []);
  const mine = useAsync(() => (me ? api.mySingles(me._id) : Promise.resolve([])), [me?._id]);
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');
  const [sector, setSector] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mineIds = useMemo(() => new Set((mine.data ?? []).map((s) => s._id)), [mine.data]);

  const list = useMemo(() => {
    const min = Number(minAge) || 0;
    const max = Number(maxAge) || Infinity;
    return (pool.data ?? []).filter((s) => {
      const age = s.age;
      return (
        (!gender || s.gender === gender) &&
        (!sector || s.sectors.includes(sector as never)) &&
        age >= min &&
        age <= max &&
        matchesQuery(query, s.firstName, s.city, s.currentOccupation, s.basicDescription, ...(s.interests ?? []))
      );
    });
  }, [pool.data, query, gender, sector, minAge, maxAge]);

  const adopt = async (singleId: string) => {
    if (!me) return;
    setBusyId(singleId);
    setError(null);
    try {
      await api.adoptSingle(me._id, singleId);
      mine.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ההוספה נכשלה');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>מאגר משותף</h1>
          <p className="muted">
            מועמדים ששדכנים בחרו לשתף. בלי שם משפחה, פרטי קשר ותמונות. {me ? 'הוספה לרשימה שלך פותחת את הכרטיס המלא.' : ''}
          </p>
        </div>
      </div>

      <div className="toolbar toolbar--filters">
        <input className="toolbar__search" type="search" placeholder="חיפוש חופשי" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="חיפוש" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="מגדר">
          <option value="">כל המגדרים</option>
          <option value="נקבה">בנות</option>
          <option value="זכר">בנים</option>
        </select>
        <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="מגזר">
          <option value="">כל המגזרים</option>
          {SECTORS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="range range--compact">
          <input inputMode="numeric" placeholder="מגיל" aria-label="מגיל" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          <span>–</span>
          <input inputMode="numeric" placeholder="עד גיל" aria-label="עד גיל" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {pool.loading ? (
        <Spinner />
      ) : pool.error ? (
        <ErrorBox message={pool.error} onRetry={pool.reload} />
      ) : list.length === 0 ? (
        <EmptyState title={pool.data?.length ? 'אין תוצאות לסינון הזה' : 'המאגר עדיין ריק'} />
      ) : (
        <>
          <p className="muted count">{list.length} תוצאות</p>
          <div className="grid">
            {list.map((s) => {
              const isMine = mineIds.has(s._id);
              return (
                <SingleCard
                  key={s._id}
                  single={s}
                  footer={
                    s.desiredAgeRange?.min || s.desiredAgeRange?.max ? (
                      <p className="single-card__looking">
                        מחפש/ת גילאי {s.desiredAgeRange.min ?? '?'}–{s.desiredAgeRange.max ?? '?'}
                      </p>
                    ) : undefined
                  }
                  actions={
                    !me ? (
                      <Link to="/login" state={{ from: '/pool' }} className="btn btn--ghost btn--sm">
                        כניסה כדי להוסיף
                      </Link>
                    ) : isMine ? (
                      <Link to={`/singles/${s._id}`} className="btn btn--ghost btn--sm">
                        ברשימה שלך · לכרטיס
                      </Link>
                    ) : (
                      <button type="button" className="btn btn--primary btn--sm" disabled={busyId === s._id} onClick={() => adopt(s._id)}>
                        {busyId === s._id ? 'מוסיף…' : 'הוספה לרשימה שלי'}
                      </button>
                    )
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
