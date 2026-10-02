import { useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Dices, Hourglass, Lightbulb, RefreshCw, Shuffle, Sparkles, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { BRAINSTORM_MODES, type BrainstormMode } from '../api/types';
import { SuggestionCard } from '../components/proposals';
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { MODE_INFO, pickDifferent, THINKING_PROMPTS } from '../lib/brainstorm';
import { useAsync } from '../lib/useAsync';
import { cn } from '../lib/utils';

const MODE_ICON: Record<BrainstormMode, ComponentType<{ className?: string }>> = {
  random: Dices,
  pool: Sparkles,
  waiting: Hourglass,
  outside: Compass,
  single: UserRound,
};

/** A question to think about, with a button for another one. */
function ThinkingPrompt() {
  const [prompt, setPrompt] = useState(() => pickDifferent(THINKING_PROMPTS));
  return (
    <Card className="mb-6 flex items-start gap-3 border-gold/30 bg-gold-soft/60 p-4 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-gold shadow-sm" aria-hidden>
        <Lightbulb className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs font-semibold text-gold">שאלה לחשוב עליה</p>
        <p className="m-0 mt-0.5 font-medium" aria-live="polite">
          {prompt}
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label="שאלה אחרת" title="שאלה אחרת" onClick={() => setPrompt((p) => pickDifferent(THINKING_PROMPTS, p))}>
        <RefreshCw />
      </Button>
    </Card>
  );
}

export function BrainstormPage() {
  const me = useMe();
  const [mode, setMode] = useState<BrainstormMode>('random');
  const [singleId, setSingleId] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(0);
  const singles = useAsync(() => api.mySingles(me._id), [me._id]);
  const needsSingle = mode === 'single' && !singleId;
  const ideas = useAsync(
    () => (needsSingle ? Promise.resolve([]) : api.brainstorm(mode, { single: mode === 'single' ? singleId : undefined })),
    [mode, singleId]
  );
  const shuffle = () => {
    setHidden(new Set());
    ideas.reload();
  };
  const key = (i: { single: { _id: string }; candidate: { _id: string } }) => i.single._id + i.candidate._id;
  const items = (ideas.data ?? []).filter((i) => !hidden.has(key(i)));
  const hide = (k: string) => setHidden((h) => new Set(h).add(k));

  return (
    <div>
      <PageHeader title="סיעור מוחות" subtitle="דרכים לרענן את המחשבה: זוגות אקראיים וכיוונים שלא היית בודק/ת בדרך כלל.">
        <Button onClick={shuffle} disabled={ideas.loading || needsSingle}>
          <Shuffle className={cn(ideas.loading && 'animate-spin')} aria-hidden />
          ערבוב מחדש
        </Button>
      </PageHeader>

      <ThinkingPrompt />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup" aria-label="סוג רעיונות">
        {BRAINSTORM_MODES.map((m) => {
          const Icon = MODE_ICON[m];
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setMode(m);
                setHidden(new Set());
              }}
              className={cn(
                'flex flex-col items-start gap-1.5 rounded-lg border bg-card p-3 text-start text-sm font-semibold shadow-soft transition hover:-translate-y-px hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active && 'border-primary bg-primary-soft text-primary'
              )}
            >
              <Icon className="size-5" aria-hidden />
              {MODE_INFO[m].label}
            </button>
          );
        })}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{MODE_INFO[mode].description}</p>

      {mode === 'single' && (
        <div className="mb-5 max-w-sm">
          <Select value={singleId} onChange={(e) => setSingleId(e.target.value)} aria-label="מועמד/ת">
            <option value="">בחירת מועמד/ת…</option>
            {(singles.data ?? []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </Select>
        </div>
      )}

      {saved > 0 && (
        <p className="mb-4 rounded-md bg-success-soft px-4 py-2.5 text-sm text-success" role="status">
          {saved === 1 ? 'נשמר רעיון אחד' : `נשמרו ${saved} רעיונות`}. אפשר לראות ב<Link to="/proposals" className="font-semibold underline">מעקב ההצעות</Link>.
        </p>
      )}

      {needsSingle ? (
        <EmptyState title="בוחרים מועמד/ת">ונציע כמה כיוונים אקראיים בשבילו/ה.</EmptyState>
      ) : ideas.loading && !ideas.data ? (
        <Spinner label="מערבבים…" />
      ) : ideas.error ? (
        <ErrorBox message={ideas.error} onRetry={ideas.reload} />
      ) : items.length === 0 ? (
        <EmptyState title="אין כרגע רעיונות חדשים כאן">
          נסו מצב אחר, או הוסיפו מועמדים. זוגות שכבר יש עליהם הצעה לא מוצגים שוב.
        </EmptyState>
      ) : (
        <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4', ideas.loading && 'opacity-60')}>
          {items.map((i) => (
            <SuggestionCard
              key={key(i)}
              suggestion={i}
              onDismiss={() => hide(key(i))}
              onCreated={() => {
                hide(key(i));
                setSaved((n) => n + 1);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
