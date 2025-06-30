import * as React from "react";
import { cn } from "@/lib/utils";
import { inputStyles } from "@/lib/theme";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          inputStyles.base,
          inputStyles.hover,
          inputStyles.focus,
          "min-h-[60px] w-full resize-y",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
