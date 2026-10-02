import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

/**
 * Modal dialog: closes on Escape and on a click outside the panel, and locks
 * the page scroll while open. A bottom sheet on phones.
 */
export function Dialog({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px] animate-in fade-in-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border bg-card p-5 shadow-lift animate-in slide-in-from-bottom-4 sm:rounded-xl sm:p-6 sm:zoom-in-95 sm:slide-in-from-bottom-0',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="סגירה">
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
