import { useRef, useState } from 'react';
import { X } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-2.5">
      {value.map((src, i) => (
        <figure key={i} className="relative m-0 size-24 sm:size-28">
          <img className="size-full rounded-md border object-cover" src={src} alt={`תמונה ${i + 1}`} />
          <button
            type="button"
            className="absolute start-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={`הסרת תמונה ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X className="size-4" aria-hidden />
          </button>
        </figure>
      ))}
      {value.length < MAX_IMAGES && (
        <button
          type="button"
          className="grid size-24 place-items-center rounded-md border-2 border-dashed border-input bg-muted/40 px-2 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 sm:size-28"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? 'מעבד…' : '+ הוספת תמונה'}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <small className="w-full text-xs font-medium text-destructive">{error}</small>}
    </div>
  );
}
