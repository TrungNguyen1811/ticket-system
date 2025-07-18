import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/theme";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: cn(
          buttonStyles.primary.base,
          buttonStyles.primary.hover,
          buttonStyles.primary.active,
          buttonStyles.primary.disabled,
        ),
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: cn(
          buttonStyles.secondary.base,
          buttonStyles.secondary.hover,
          buttonStyles.secondary.active,
          buttonStyles.secondary.disabled,
        ),
        secondary: cn(
          buttonStyles.secondary.base,
          buttonStyles.secondary.hover,
          buttonStyles.secondary.active,
          buttonStyles.secondary.disabled,
        ),
        ghost: cn(
          buttonStyles.ghost.base,
          buttonStyles.ghost.hover,
          buttonStyles.ghost.active,
          buttonStyles.ghost.disabled,
        ),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
