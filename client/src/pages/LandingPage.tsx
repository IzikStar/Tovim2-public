import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/ui/card';
import { buttonVariants } from '../components/ui/button';

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
    <div>
      <section className="mx-auto max-w-[760px] pb-9 pt-8 text-center sm:pt-12">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold leading-tight">
          כלי עבודה <span className="text-primary">לשדכנים ולשדכניות</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          טובים מרכזת את המועמדים שלכם, מאפשרת להם להירשם בעצמם דרך קישור, ומחברת אתכם לשדכנים אחרים דרך מאגר משותף
          ששומר על פרטיות.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className={buttonVariants({ size: 'lg' })} to="/signup">
            הרשמה לשדכנים
          </Link>
          <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to="/login">
            כבר רשומים? כניסה
          </Link>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-5">
            <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary-soft text-2xl" aria-hidden>
              {f.icon}
            </div>
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="m-0 text-sm text-muted-foreground">{f.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
