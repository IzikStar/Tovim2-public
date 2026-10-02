import * as React from 'react';
import { cn } from '../../lib/utils';

/** Native checkbox in the theme color, with its label text as children. */
const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { children?: React.ReactNode }>(
  ({ className, children, ...props }, ref) => (
    <label className={cn('inline-flex cursor-pointer items-start gap-2.5 text-[0.95rem]', className)}>
      <input ref={ref} type="checkbox" className="mt-1 size-4 shrink-0 cursor-pointer rounded accent-primary" {...props} />
      {children && <span>{children}</span>}
    </label>
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
