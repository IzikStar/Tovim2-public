import { useId, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { initials } from '../lib/format';
import { cn } from '../lib/utils';
import { Badge as UiBadge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';

export function Spinner({ label = 'טוען…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          לנסות שוב
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card/60 px-6 py-12 text-center text-muted-foreground">
      <div className="mb-1 grid size-14 place-items-center rounded-full bg-primary-soft text-2xl" aria-hidden>
        💌
      </div>
      <h3 className="text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function Avatar({
  image,
  firstName,
  lastName,
  size = 56,
  className,
}: {
  image?: string;
  firstName: string;
  lastName?: string;
  size?: number;
  className?: string;
}) {
  return image ? (
    <img className={cn('shrink-0 rounded-full object-cover', className)} src={image} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-soft to-accent font-bold text-primary',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  wide,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', wide && 'sm:col-span-2')} data-error={error ? 'true' : undefined}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-primary" aria-hidden>
            {' '}*
          </span>
        )}
      </label>
      {children(id)}
      {hint && !error && <small className="text-xs text-muted-foreground">{hint}</small>}
      {error && <small className="text-xs font-medium text-destructive">{error}</small>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog title={title} onClose={onClose} className={wide ? 'max-w-3xl' : undefined}>
      {children}
    </Dialog>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' }) {
  return <UiBadge variant={tone}>{children}</UiBadge>;
}

/** Page title row with optional actions (buttons) on the other side. */
export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
