import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-muted-foreground',
        accent: 'bg-primary-soft text-primary',
        ok: 'bg-success-soft text-success',
        warn: 'bg-warning-soft text-warning',
        bad: 'bg-destructive-soft text-destructive',
        gold: 'bg-gold-soft text-gold',
        outline: 'border bg-card text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
