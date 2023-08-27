export namespace MotionVariants {
  export const SlideIn = {
    initial: {
      opacity: 0,
      x: -40,
      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    exit: {
      x: -40,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
  };
  export const SlideUp = {
    initial: {
      y: 20,
      opacity: 0,
      transition: { type: "spring", duration: 0.8, bounce: 0.3 },
    },
    exit: { y: -20, opacity: 0, transition: { type: "spring", duration: 0.5 } },
    animate: (custom = 0) => ({
      y: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.5, delay: custom * 0.05 },
    }),
  };
  export const SpringScale = {
    initial: {
      scale: 1.2,
      opacity: 0,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
  };
  export const SpringScaleReversed = {
    initial: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
  };
}
