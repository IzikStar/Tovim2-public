import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { controlClass } from './input';

/** A styled native <select>: keeps mobile pickers and form semantics. */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(controlClass, 'h-10 appearance-none py-2 pe-9 ps-3')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
