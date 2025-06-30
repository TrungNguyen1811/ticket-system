import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  className?: string;
}

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
PageTransition.displayName = "PageTransition";

export { PageTransition };
