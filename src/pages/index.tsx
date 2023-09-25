import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";

import { FillRow, FillColumn, HugColumn } from "@/layout";
import { MotionIconWrapper } from "@/layout/atoms";
import { LockIcon } from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MotionVariants } from "@/styles/motion";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Head>
        <title>Eduard Lotz — Design + Development</title>
        <meta name="description" content="Eduard Lotz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <FillColumn>
        <AnimatePresence mode="popLayout">
          <HugColumn
            $gap="0"
            $justify="flex-start"
            $align="center"
            key="landing-hello"
            variants={MotionVariants.SlideUp}
            animate="animate"
            exit="exit"
            initial="initial"
          >
            <H2>Sorry, this website is not ready yet.</H2>
          </HugColumn>
        </AnimatePresence>
        <PortfolioContainer layout>
          <LayoutGroup>
            <FillColumn
              $align="center"
              $gap="20px"
              key="start-form"
              layout="position"
            >
              <MotionIconWrapper layoutId="lock-icon" layout="position">
                <LockIcon color="#121212" />
              </MotionIconWrapper>
              <MotionIconWrapper
                layout="position"
                variants={MotionVariants.SpringScaleReversed}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <LinkButton layout="position" href="/portfolio">
                  portfolio download
                </LinkButton>
              </MotionIconWrapper>
            </FillColumn>
          </LayoutGroup>
        </PortfolioContainer>
      </FillColumn>

      <BottomInfoWrapper
        variants={MotionVariants.SlideUp}
        animate="animate"
        exit="exit"
        initial="initial"
        custom={6}
      >
        <BottomText>
          Over time, this website will eventually become a place for sharing my
          thoughts and ideas in a creative way. My personal collection of ideas,
          notes and inspirations.
        </BottomText>
      </BottomInfoWrapper>
    </>
  );
}

const PortfolioContainer = styled(FillRow)`
  align-items: center;
  justify-content: center;
  margin-top: 40px;
`;

const BottomInfoWrapper = styled(FillRow)`
  height: 100%;
  align-items: flex-end;
`;

const LinkButton = styled(motion(Link))`
  display: flex;
  width: 310px;
  max-width: 100%;
  padding: 20px 30px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 50px;
  background: #121212;

  color: #fff;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-decoration: none;

  box-shadow: 0px 0px 0px 0px #121212;
  transition: box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  overflow: hidden;

  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 0px 4px #121212;
  }
`;
