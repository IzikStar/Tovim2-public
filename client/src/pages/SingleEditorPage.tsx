import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { SingleForm } from '../components/SingleForm';
import { ErrorBox, Spinner } from '../components/ui';
import { emptySingleForm, singleToForm } from '../lib/singleForm';
import { useAsync } from '../lib/useAsync';

export function NewSinglePage() {
  const me = useMe();
  const navigate = useNavigate();
  return (
    <div className="page page--narrow">
      <Link to="/dashboard" className="back">
        → חזרה לרשימה
      </Link>
      <h1>מועמד/ת חדש/ה</h1>
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
    <div className="page page--narrow">
      <Link to={`/singles/${id}`} className="back">
        → חזרה לכרטיס
      </Link>
      <h1>עריכת פרטים</h1>
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
