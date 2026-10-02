import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SingleForm } from '../components/SingleForm';
import { Check } from 'lucide-react';
import { ErrorBox, Spinner } from '../components/ui';
import { Card } from '../components/ui/card';
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
      <div className="mx-auto w-full max-w-[820px]">
        <ErrorBox message="הקישור לא תקין. כדאי לבקש מהשדכן/ית קישור חדש." />
      </div>
    );
  }
  const m = matchMaker.data;

  if (done) {
    return (
      <div className="mx-auto w-full max-w-[820px]">
        <Card className="px-6 py-10 text-center">
          <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-success-soft text-success" aria-hidden>
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mb-2">הפרטים נשלחו</h1>
          <p className="text-muted-foreground">
            {m.firstName} {m.lastName} קיבלו את השאלון שלך ויחזרו אליך. בהצלחה!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <Card className="mb-5 flex items-start gap-4 bg-gradient-to-br from-card to-primary-soft/60 p-5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-primary to-[hsl(345_55%_55%)] text-lg font-bold text-white shadow-sm"
          aria-hidden
        >
          ט
        </span>
        <div className="min-w-0">
          <h1 className="mb-1">שאלון היכרות</h1>
          <p className="text-muted-foreground">
            הפרטים יישלחו ל{m.firstName} {m.lastName}
            {m.city ? ` (${m.city})` : ''}. כדאי למלא בכנות ובפירוט: זה מה שעוזר למצוא התאמה טובה.
          </p>
        </div>
      </Card>
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
