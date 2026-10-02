import * as React from 'react';
import { cn } from '../../lib/utils';

/** Shared by Input, Textarea and Select so form controls line up. */
export const controlClass =
  'w-full rounded-md border border-input bg-card px-3 text-[0.95rem] shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={cn(controlClass, 'h-10 py-2', className)} {...props} />
  )
);
Input.displayName = 'Input';

export { Input };
