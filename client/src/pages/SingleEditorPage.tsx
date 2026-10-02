import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { SingleForm } from '../components/SingleForm';
import { ErrorBox, PageHeader, Spinner } from '../components/ui';
import { emptySingleForm, singleToForm } from '../lib/singleForm';
import { useAsync } from '../lib/useAsync';

export function NewSinglePage() {
  const me = useMe();
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-[820px]">
      <Link to="/dashboard" className="mb-3 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
        → חזרה לרשימה
      </Link>
      <PageHeader title="מועמד/ת חדש/ה" />
      <SingleForm
        initial={emptySingleForm()}
        submitLabel="שמירת מועמד/ת"
        onSubmit={async (payload) => {
          const created = await api.createSingle(me._id, payload);
          navigate(`/singles/${created._id}`, { replace: true });
        }}
      />
    </div>
  );
}

export function EditSinglePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const single = useAsync(() => api.single(id), [id]);

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <Link to={`/singles/${id}`} className="mb-3 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
        → חזרה לכרטיס
      </Link>
      <PageHeader title="עריכת פרטים" />
      {single.loading ? (
        <Spinner />
      ) : single.error || !single.data ? (
        <ErrorBox message={single.error ?? 'לא נמצא'} onRetry={single.reload} />
      ) : (
        <SingleForm
          initial={singleToForm(single.data)}
          submitLabel="שמירת שינויים"
          onSubmit={async (payload) => {
            await api.updateSingle(id, payload);
            navigate(`/singles/${id}`);
          }}
        />
      )}
    </div>
  );
}
