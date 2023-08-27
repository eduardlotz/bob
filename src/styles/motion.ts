export namespace Transitions {
  export const Sidebar = {
    duration: 0.25,
    ease: "circOut",
  };
  export const Backdrop = {
    duration: 0.15,
    ease: "circOut",
  };
  export const ReviewDetail = {
    layout: { type: "spring", duration: 0.6, bounce: 0.2 },
  };
}

export namespace MotionVariants {
  export const FadeInOut = {
    initial: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "circOut",
      },
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: "circOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.1,
        ease: "circIn",
      },
    },
  };
  export const SlideUp = {
    initial: {
      y: 20,
      opacity: 0,
      transition: { type: "spring", duration: 0.3, bounce: 0.3 },
    },
    exit: { y: -20, opacity: 0, transition: { type: "spring", duration: 0.3 } },
    animate: (custom = 0) => ({
      y: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.3, delay: custom * 0.02 },
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
  export const SpringSlide = {
    initial: {
      x: 10,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    exit: {
      x: 10,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
  };
  export const DropdownMenu = {
    initial: {
      y: -10,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    exit: {
      y: 10,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
  };
  export const SelectBox = {
    initial: {
      scale: 0.95,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", duration: 0.4, bounce: 0.3 },
    },
  };
  export const ReviewReply = {
    downUp: {
      initial: {
        y: 20,
        opacity: 0,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
      exit: {
        y: 20,
        opacity: 0,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
      animate: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
    },
    upDown: {
      initial: {
        y: -20,
        opacity: 0,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
      exit: {
        y: -20,
        opacity: 0,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
      animate: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", duration: 0.4, bounce: 0.3 },
      },
    },
  };
  export const Auth = {
    initial: {
      opacity: 0,
      transition: { type: "spring", duration: 0.8, bounce: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { type: "spring", duration: 0.8, bounce: 0.3 },
    },
    animate: {
      opacity: 1,
      transition: { type: "spring", duration: 0.8, bounce: 0.3 },
    },
  };
}
