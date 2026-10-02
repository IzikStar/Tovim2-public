import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SingleForm } from '../components/SingleForm';
import { ErrorBox, Spinner } from '../components/ui';
import { emptySingleForm } from '../lib/singleForm';
import { useAsync } from '../lib/useAsync';

/** Opened by a single from their matchmaker's link: /register/:matchMakerId */
export function RegisterSinglePage() {
  const { matchMakerId = '' } = useParams();
  const matchMaker = useAsync(() => api.publicMatchMaker(matchMakerId), [matchMakerId]);
  const [done, setDone] = useState(false);

  if (matchMaker.loading) return <Spinner />;
  if (matchMaker.error || !matchMaker.data) {
    return (
      <div className="page page--narrow">
        <ErrorBox message="הקישור לא תקין. כדאי לבקש מהשדכן/ית קישור חדש." />
      </div>
    );
  }
  const m = matchMaker.data;

  if (done) {
    return (
      <div className="page page--narrow">
        <div className="card success">
          <div className="success__icon" aria-hidden>
            ✓
          </div>
          <h1>הפרטים נשלחו</h1>
          <p>
            {m.firstName} {m.lastName} קיבלו את השאלון שלך ויחזרו אליך. בהצלחה!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <div className="register-intro card">
        <span className="brand__mark" aria-hidden>
          ט
        </span>
        <div>
          <h1>שאלון היכרות</h1>
          <p>
            הפרטים יישלחו ל{m.firstName} {m.lastName}
            {m.city ? ` (${m.city})` : ''}. כדאי למלא בכנות ובפירוט: זה מה שעוזר למצוא התאמה טובה.
          </p>
        </div>
      </div>
      <SingleForm
        selfRegistration
        initial={emptySingleForm()}
        submitLabel="שליחה לשדכן/ית"
        onSubmit={async (payload) => {
          await api.registerSingle(matchMakerId, payload);
          setDone(true);
          window.scrollTo({ top: 0 });
        }}
      />
    </div>
  );
}
