import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { SingleCard } from '../components/SingleCard';
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { buttonVariants } from '../components/ui/button';
import { useAsync } from '../lib/useAsync';
import { cn } from '../lib/utils';

/** Singles who got married (marked through a proposal or by hand). */
export function CouplesPage() {
  const me = useMe();
  const couples = useAsync(() => api.myCouples(me._id), [me._id]);
  const mine = (couples.data ?? []).filter((s) => s.marriedMatchmaker === me._id).length;

  return (
    <div>
      <PageHeader title="זוגות שהתחתנו 💍" subtitle={`${mine} מועמדים התחתנו בשידוך שלך`} />
      {couples.loading && !couples.data ? (
        <Spinner />
      ) : couples.error ? (
        <ErrorBox message={couples.error} onRetry={couples.reload} />
      ) : !couples.data?.length ? (
        <EmptyState title="עוד אין זוגות">
          <p>כשהצעה מגיעה לשלב "התחתנו", שני הצדדים עוברים לכאן.</p>
          <Link to="/proposals" className={cn(buttonVariants(), 'mt-2')}>
            למעקב ההצעות
          </Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {couples.data.map((s) => (
            <Link key={s._id} to={`/singles/${s._id}`} className="block rounded-lg text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <SingleCard single={s} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
