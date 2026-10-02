import { useState, type KeyboardEvent } from 'react';

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
    <div className="chips chips--input">
      {value.map((item) => (
        <span key={item} className="chip chip--on">
          {item}
          <button type="button" aria-label={`הסרת ${item}`} onClick={() => onChange(value.filter((v) => v !== item))}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
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
    <div className="chips" role="group" aria-label={label}>
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={`chip${on ? ' chip--on' : ''}`}
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
