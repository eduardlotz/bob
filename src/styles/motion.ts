import { cubicBezier } from "motion";
import { blur } from "three/tsl";

export namespace MotionVariants {
  export const SlideInDown = {
    initial: {
      y: -40,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    animate: {
      y: 0,
      opacity: 1,

      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    exit: {
      y: -40,
      opacity: 0,

      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
  };
  export const SlideUp = {
    initial: {
      y: 20,
      opacity: 0,
      // filter: "blur(4px)",
      transition: {
        type: "spring",
        duration: 0.8,
        bounce: 0.3,
        layout: {
          type: "spring",
          duration: 0.2,
          bounce: 0.4,
        },
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      // filter: "blur(4px)",
      transition: {
        type: "spring",
        duration: 0.5,
        bounce: 0.3,
        layout: {
          type: "spring",
          duration: 0.2,
          bounce: 0.4,
        },
      },
    },
    animate: (custom = 0) => ({
      y: 0,
      opacity: 1,
      // filter: "blur(0px)",
      transition: {
        type: "spring",
        duration: 0.6,
        bounce: 0.3,
        delay: custom * 0.02,
        layout: {
          type: "spring",
          duration: 0.2,
          bounce: 0.4,
        },
      },
    }),
  };
  export const SpringScale = {
    initial: {
      scale: 1.2,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.4 },
    },
    exit: {
      scale: [1.1, 0.8],
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.4 },
    },
    animate: (custom = 0) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        duration: 0.4,
        bounce: 0.4,
        delay: custom * 0.02,
      },
    }),
  };
  export const SpringScaleReversed = {
    initial: {
      scale: 0.9,
      opacity: 0,
      filter: "blur(4px)",
      transition: { type: "spring", mass: 0.5, bounce: 0.4 },
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      filter: "blur(4px)",
      transition: { type: "spring", mass: 0.5, bounce: 0.4 },
    },
    animate: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "spring", mass: 0.5, bounce: 0.4 },
    },
  };
  export const Pulse = {
    initial: {
      scale: 1,
      opacity: 1,
    },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.9, 1],
      transition: {
        repeat: Infinity,
        duration: 1.6,
        cubicBezier: "0.2, 0.8, 0.2, 0.8",
      },
    },
  };
}
export namespace LayoutTransition {
  export const quick = {
    layout: {
      type: "spring",
      duration: 0.2,
      bounce: 0.4,
    },
  };
}
