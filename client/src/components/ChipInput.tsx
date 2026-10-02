import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

const chipBase =
  'inline-flex items-center rounded-full border px-3 py-1 text-[0.875rem] leading-tight transition-colors';
const chipOn = 'border-primary/30 bg-primary-soft text-primary';

/** Free-text list: type and press Enter (or comma) to add, click × to remove. */
export function ChipInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const text = draft.trim().replace(/,$/, '');
    if (text && !value.includes(text)) onChange([...value, text]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-card p-1.5 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
      {value.map((item) => (
        <span key={item} className={cn(chipBase, chipOn, 'gap-1 pe-1.5')}>
          {item}
          <button
            type="button"
            className="grid size-5 place-items-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`הסרת ${item}`}
            onClick={() => onChange(value.filter((v) => v !== item))}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-1.5 text-[0.95rem] placeholder:text-muted-foreground/70 focus:outline-none"
        placeholder={value.length ? '' : placeholder}
      />
    </div>
  );
}

/** Toggle chips for a fixed list of options. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  label: string;
}) {
  const toggle = (opt: T) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={cn(
              chipBase,
              'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              on ? chipOn : 'border-border bg-card text-foreground hover:border-foreground/25'
            )}
            aria-pressed={on}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
