import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const FEATURES = [
  { icon: '🗂️', title: 'כל המועמדים במקום אחד', text: 'כרטיס מלא לכל מועמד/ת: רקע, מה מחפשים, תמונות וממליצים.' },
  { icon: '🔗', title: 'קישור הרשמה אישי', text: 'שולחים למועמד/ת קישור, והם ממלאים את השאלון בעצמם.' },
  { icon: '🤝', title: 'מאגר משותף', text: 'מוצאים התאמות אצל שדכנים אחרים, בלי לחשוף פרטי קשר.' },
  { icon: '📨', title: 'העברת מועמדים', text: 'שולחים בקשה לשדכן/ית אחר/ת, והם מאשרים או דוחים.' },
];

export function LandingPage() {
  const { me } = useAuth();
  if (me) return <Navigate to="/dashboard" replace />;
  return (
    <div className="landing">
      <section className="hero">
        <h1>
          כלי עבודה <span className="hero__accent">לשדכנים ולשדכניות</span>
        </h1>
        <p className="hero__lead">
          טובים מרכזת את המועמדים שלכם, מאפשרת להם להירשם בעצמם דרך קישור, ומחברת אתכם לשדכנים אחרים דרך מאגר משותף
          ששומר על פרטיות.
        </p>
        <div className="hero__cta">
          <Link className="btn btn--primary btn--lg" to="/signup">
            הרשמה לשדכנים
          </Link>
          <Link className="btn btn--ghost btn--lg" to="/login">
            כבר רשומים? כניסה
          </Link>
        </div>
      </section>
      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature card">
            <div className="feature__icon" aria-hidden>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
