import { cubicBezier } from "motion";

export namespace MotionVariants {
  export const SlideInDown = {
    initial: {
      y: -40,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
    animate: {
      y: 0,
      opacity: 1,

      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
    exit: {
      y: -40,
      opacity: 0,

      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
  };
  export const SlideUp = {
    initial: {
      y: 20,
      opacity: 0,
      // filter: "blur(4px)",
      transition: {
        type: "spring" as const,
        duration: 0.8,
        bounce: 0.3,
        layout: {
          type: "spring" as const,
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
        type: "spring" as const,
        duration: 0.5,
        bounce: 0.3,
        layout: {
          type: "spring" as const,
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
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.3,
        delay: custom * 0.02,
        layout: {
          type: "spring" as const,
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
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    exit: {
      scale: [1.1, 0.8],
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    animate: (custom = 0) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
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
      transition: { type: "spring" as const, mass: 0.5, bounce: 0.4 },
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      filter: "blur(4px)",
      transition: { type: "spring" as const, mass: 0.5, bounce: 0.4 },
    },
    animate: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "spring" as const, mass: 0.5, bounce: 0.4 },
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
        ease: cubicBezier(0.2, 0.8, 0.2, 0.8),
      },
    },
  };
  export const OptionButton = {
    initial: {
      scale: 0.8,
      opacity: 0,
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      filter: "blur(4px)",
      transition: { type: "spring" as const, duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        duration: 0.2,
      },
    },
    hover: (custom?: {
      delay?: number;
      isLocked?: boolean;
      isDisabled?: boolean;
    }) => ({
      scale: custom?.isLocked ? 1 : 1.05,
      zIndex: 1001,
      boxShadow: "0 2px 16px rgba(22, 22, 22, 0.13)",
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    }),
    tap: {
      scale: 0.95,
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    },
    animate: (custom?: {
      delay?: number;
      isLocked?: boolean;
      isDisabled?: boolean;
    }) => ({
      scale: 1,
      opacity: custom?.isLocked ? 0.5 : 1,
      boxShadow: custom?.isDisabled ? `none` : "0 2px 16px rgba(0, 0, 0, 0.2)",
      filter: custom?.isLocked ? "blur(2px)" : "blur(0px)",
      transition: {
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.6,
        delay: custom?.delay ? custom.delay * 0.05 : 0,
      },
    }),
  } as const;
  export const PopIn = {
    initial: {
      scale: 0.8,
      opacity: 0,
      filter: "blur(4px)",
      transition: { type: "spring" as const, duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        duration: 0.2,
      },
    },
    animate: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.6,
      },
    },
  } as const;
}
export namespace Transitions {
  export const quick = {
    layout: {
      type: "spring" as const,
      duration: 0.3,
      bounce: 0.3,
    },
  };

  // inertia =  animation will continue to move after drag
  export const inertiaTransition = {
    type: "inertia" as const,
    bounceStiffness: 300,
    bounceDamping: 40,
    timeConstant: 300,
  };

  // static = animation will not move after drag
  export const staticTransition = {
    type: "tween" as const,
    duration: 0.5,
    ease: cubicBezier(0.32, 0.72, 0, 1),
  };
}
