import {
  ContentWidth,
  FillColumn,
  FillRow,
  FullScreen,
  HugRow,
} from "@/layout";
import { IconLink, Logo } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { useEffect } from "react";
import { motion } from "motion/react";

export const SceneWithLoader = dynamic(
  () =>
    import("@/molecules/Scene").then((mod) => {
      return { default: (props: any) => <mod.Scene {...props} /> };
    }),
  {
    ssr: false,
    loading: () => (
      <LoadingWrapper>
        <FillRow $align="center" $justify="center">
          <IconLink
            href="/"
            variants={MotionVariants.Pulse}
            animate="animate"
            exit="exit"
            initial="initial"
          >
            <Logo />
          </IconLink>
        </FillRow>
      </LoadingWrapper>
    ),
  }
);

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  width: 100dvw;
  height: 100dvh;
  padding: 40px 16px 0 16px;

  display: flex;
  align-items: center;
  justify-content: center;
`;
