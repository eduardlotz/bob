import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";

import { FillRow, FillColumn, HugColumn, ContentWidth } from "@/layout";
import { IconLink, Logo, MotionIconWrapper } from "@/layout/atoms";
import { LockIcon } from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MotionVariants } from "@/styles/motion";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CameraControls } from "@react-three/drei";
import { SceneWithLoader } from "@/molecules/SceneWithLoader";

export default function Home() {
  return (
    <>
      <Head>
        <title>Eduard Lotz — Design + Development</title>
        <meta name="description" content="Eduard Lotz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* <NavigationWrapper>
        <ContentWidth>
          <FillRow $align="center" $justify="center">
            <IconLink
              href="/"
              variants={MotionVariants.SpringScale}
              animate="animate"
              exit="exit"
              initial="initial"
              layoutId="logo"
              custom={68}
            >
              <Logo />
            </IconLink>
          </FillRow>
        </ContentWidth>
      </NavigationWrapper> */}

      <AnimatePresence>
        <SceneWithLoader />
      </AnimatePresence>
    </>
  );
}
const NavigationWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  width: 100%;
  padding: 40px 16px 0 16px;

  display: flex;
  align-items: center;
  justify-content: center;
`;
