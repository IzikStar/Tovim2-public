import { useRef, useState } from 'react';
import { resizeImage } from '../lib/images';

const MAX_IMAGES = 4;

export function ImagePicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const room = MAX_IMAGES - value.length;
      const picked = Array.from(files).slice(0, room);
      const resized = await Promise.all(picked.map((f) => resizeImage(f)));
      onChange([...value, ...resized]);
      if (files.length > room) setError(`אפשר עד ${MAX_IMAGES} תמונות`);
    } catch {
      setError('אחד הקבצים אינו תמונה תקינה');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="images">
      {value.map((src, i) => (
        <figure key={i} className="images__item">
          <img src={src} alt={`תמונה ${i + 1}`} />
          <button
            type="button"
            className="images__remove"
            aria-label={`הסרת תמונה ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </figure>
      ))}
      {value.length < MAX_IMAGES && (
        <button type="button" className="images__add" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'מעבד…' : '+ הוספת תמונה'}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <small className="field__error images__error">{error}</small>}
    </div>
  );
}
