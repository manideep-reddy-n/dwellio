"use client";

import { motion } from "framer-motion";
import { motionConfig } from "@/config/motion";
import { useUiStore } from "@/stores/ui-store";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={motionConfig.page.initial}
      animate={motionConfig.page.animate}
      transition={motionConfig.page.transition}
    >
      {children}
    </motion.div>
  );
}
