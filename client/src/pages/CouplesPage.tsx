import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { SingleCard } from '../components/SingleCard';
import { EmptyState, ErrorBox, Spinner } from '../components/ui';
import { useAsync } from '../lib/useAsync';

/** Singles who got married (marked through a proposal or by hand). */
export function CouplesPage() {
  const me = useMe();
  const couples = useAsync(() => api.myCouples(me._id), [me._id]);
  const mine = (couples.data ?? []).filter((s) => s.marriedMatchmaker === me._id).length;

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>זוגות שהתחתנו 💍</h1>
          <p className="muted">{mine} מועמדים התחתנו בשידוך שלך</p>
        </div>
      </div>
      {couples.loading && !couples.data ? (
        <Spinner />
      ) : couples.error ? (
        <ErrorBox message={couples.error} onRetry={couples.reload} />
      ) : !couples.data?.length ? (
        <EmptyState title="עוד אין זוגות">
          <p>כשהצעה מגיעה לשלב "התחתנו", שני הצדדים עוברים לכאן.</p>
          <Link to="/proposals" className="btn btn--primary">
            למעקב ההצעות
          </Link>
        </EmptyState>
      ) : (
        <div className="grid">
          {couples.data.map((s) => (
            <Link key={s._id} to={`/singles/${s._id}`} className="card-link">
              <SingleCard single={s} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
