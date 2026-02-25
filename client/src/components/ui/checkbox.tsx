import * as React from "react";
import { cn } from "../../lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
