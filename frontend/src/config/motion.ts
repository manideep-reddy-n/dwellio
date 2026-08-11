export const motionConfig = {
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
} as const;
