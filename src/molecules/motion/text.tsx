import { MotionVariants } from "@/styles/motion";
import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";

const getLetters = (str: string) =>
  str.split("").map((text, index) => {
    if (text === " ") return { text: WHITESPACE_SYMBOL, index };
    return { text, index };
  });

const WHITESPACE_SYMBOL = "&nbsp;";

const getWords = (str: string) =>
  str.split(/(\s+)/).map((text, index) => {
    if (text === " ") return { text: WHITESPACE_SYMBOL, index };
    return { text, index };
  });

interface ISlideUpProps {
  text: string;
  component: React.ComponentType<any>;
  splitBy?: "letters" | "words";
}

export const DelayedText = ({
  text,
  component: Component,
  splitBy = "letters",
}: ISlideUpProps) => {
  const splittedText =
    splitBy === "letters" ? getLetters(text) : getWords(text);

  return (
    <SplitTextWrapper key={`${text}-wrapper`} layout>
      {splittedText.map((letter, index) => {
        return letter.text === WHITESPACE_SYMBOL ? (
          <Whitespace key={`whitespace-${letter.index}`} size={splitBy} />
        ) : (
          <Component
            variants={MotionVariants.SlideUp}
            animate="animate"
            exit="exit"
            initial="initial"
            custom={index}
            key={`${text}-${letter.index}`}
          >
            {letter.text}
          </Component>
        );
      })}
    </SplitTextWrapper>
  );
};

const SplitTextWrapper = styled(motion.div)`
  width: fit-content;
  height: fit-content;

  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  /* overflow: hidden; */
`;

const Whitespace = styled(motion.div)<{ size: "words" | "letters" }>`
  /* width: ${(p) => (p.size === "words" ? "1em" : "3em")}; */
  width: 1em;
  height: 12px;
  background: transparent;
`;
