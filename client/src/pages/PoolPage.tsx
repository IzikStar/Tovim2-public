import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { SECTORS } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { SingleCard } from '../components/SingleCard';
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
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
    <div>
      <PageHeader
        title="מאגר משותף"
        subtitle={<>מועמדים ששדכנים בחרו לשתף. בלי שם משפחה, פרטי קשר ותמונות. {me ? 'הוספה לרשימה שלך פותחת את הכרטיס המלא.' : ''}</>}
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
        <Input
          className="col-span-2 sm:w-auto sm:min-w-[220px] sm:flex-1"
          type="search"
          placeholder="חיפוש חופשי"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש"
        />
        <Select className="sm:w-40" value={gender} onChange={(e) => setGender(e.target.value)} aria-label="מגדר">
          <option value="">כל המגדרים</option>
          <option value="נקבה">בנות</option>
          <option value="זכר">בנים</option>
        </Select>
        <Select className="sm:w-44" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="מגזר">
          <option value="">כל המגזרים</option>
          {SECTORS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <div className="col-span-2 flex items-center gap-2">
          <Input className="flex-1 sm:w-24 sm:flex-none" inputMode="numeric" placeholder="מגיל" aria-label="מגיל" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          <span className="text-muted-foreground">–</span>
          <Input className="flex-1 sm:w-24 sm:flex-none" inputMode="numeric" placeholder="עד גיל" aria-label="עד גיל" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
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
          <p className="mb-2.5 text-sm text-muted-foreground">{list.length} תוצאות</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => {
              const isMine = mineIds.has(s._id);
              return (
                <SingleCard
                  key={s._id}
                  single={s}
                  footer={
                    s.desiredAgeRange?.min || s.desiredAgeRange?.max ? (
                      <p className="m-0 text-sm text-muted-foreground">
                        מחפש/ת גילאי {s.desiredAgeRange.min ?? '?'}–{s.desiredAgeRange.max ?? '?'}
                      </p>
                    ) : undefined
                  }
                  actions={
                    !me ? (
                      <Link to="/login" state={{ from: '/pool' }} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        כניסה כדי להוסיף
                      </Link>
                    ) : isMine ? (
                      <Link to={`/singles/${s._id}`} className={buttonVariants({ variant: 'soft', size: 'sm' })}>
                        ברשימה שלך · לכרטיס
                      </Link>
                    ) : (
                      <Button size="sm" disabled={busyId === s._id} onClick={() => adopt(s._id)}>
                        {busyId === s._id ? 'מוסיף…' : 'הוספה לרשימה שלי'}
                      </Button>
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
