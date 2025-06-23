import * as React from "react";
import { cn } from "@/lib/utils";
import { inputStyles } from "@/lib/theme";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputStyles.base,
          inputStyles.hover,
          inputStyles.focus,
          "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-400",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
