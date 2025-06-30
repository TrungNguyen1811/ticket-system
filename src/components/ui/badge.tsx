import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { badgeStyles } from "@/lib/theme";

const badgeVariants = cva(badgeStyles.base, {
  variants: {
    variant: {
      default:
        "bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors duration-200",
      secondary:
        "bg-secondary-100 text-secondary-800 hover:bg-secondary-200 transition-colors duration-200",
      destructive: badgeStyles.error,
      outline:
        "text-secondary-700 border border-secondary-200 hover:bg-secondary-50 transition-colors duration-200",
      success: badgeStyles.success,
      warning: badgeStyles.warning,
      error: badgeStyles.error,
      info: badgeStyles.info,
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
