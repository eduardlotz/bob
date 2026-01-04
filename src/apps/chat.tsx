import { FillColumn, FillRow, HugColumn, HugRow } from "@/layout";
import { CameraViewId, useQuestStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { format } from "date-fns/format";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import styled from "styled-components";

export const ChatIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width={80} height={80} rx={24} fill="#4277F7" />
    <g clipPath="url(#clip0_3544_2460)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26.7676 25.6773C30.022 22.423 34.7148 20.8018 40.4635 20.8018C46.2122 20.8018 50.9051 22.423 54.1594 25.6773C57.4137 28.9316 59.0349 33.6245 59.0349 39.3732C59.0349 45.1219 57.4137 49.8147 54.1594 53.069C50.9051 56.3233 46.2122 57.9447 40.4635 57.9447C37.3014 57.9447 34.4605 57.4556 31.9974 56.4701L24.4343 58.9913C22.1668 59.747 20.0288 57.5504 20.8456 55.3042L23.4691 48.0899C22.415 45.5695 21.8921 42.6429 21.8921 39.3732C21.8921 33.6245 23.5133 28.9316 26.7676 25.6773ZM40.6403 42.0482C42.0173 42.0482 43.1336 40.9319 43.1336 39.5549C43.1336 38.1779 42.0173 37.0616 40.6403 37.0616C39.2633 37.0616 38.147 38.1779 38.147 39.5549C38.147 40.9319 39.2633 42.0482 40.6403 42.0482ZM34.0564 39.5549C34.0564 40.9319 32.9401 42.0482 31.5632 42.0482C30.1862 42.0482 29.0699 40.9319 29.0699 39.5549C29.0699 38.1779 30.1862 37.0616 31.5632 37.0616C32.9401 37.0616 34.0564 38.1779 34.0564 39.5549ZM49.716 42.0482C51.0931 42.0482 52.2094 40.9319 52.2094 39.5549C52.2094 38.1779 51.0931 37.0616 49.716 37.0616C48.3391 37.0616 47.2228 38.1779 47.2228 39.5549C47.2228 40.9319 48.3391 42.0482 49.716 42.0482Z"
        fill="#D7E0FF"
      />
    </g>
    <defs>
      <clipPath id="clip0_3544_2460">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(19.75 20)"
        />
      </clipPath>
    </defs>
  </svg>
);

export const ChatApp = () => {
  const { archive } = useMessageStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight + 8, //0.25rem gap
    });
  });

  return (
    <>
      <HugColumn
        style={{
          width: "25rem",
          maxWidth: "100%",
          maxHeight: "23rem",
          overflowY: "auto",
          borderRadius: "1.75rem",
          background: "rgba(0, 0, 0, 0.25)",
          padding: "0.25rem",
        }}
        $gap={"0.25rem"}
        ref={containerRef}
      >
        <AnimatePresence mode="popLayout">
          {archive.map((msg, i) => (
            <MessageContainer
              key={msg.id}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              transition={{
                type: "spring" as const,
                bounce: 0.5,
                delay: 0.03 * i,
              }}
            >
              <Text>{msg.text}</Text>

              <TimeTag>
                {msg.sender ? `${msg.sender} · ` : ""}
                {format(msg.time, "dd.MM.yy")}
              </TimeTag>
            </MessageContainer>
          ))}
        </AnimatePresence>
      </HugColumn>
      <FillRow $align="center" $justify="center">
        <AppInfo>Einmalige Nachrichten werden hier gespeichert</AppInfo>
      </FillRow>
    </>
  );
};

const AppInfo = styled.p`
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-color);
  opacity: 0.5;
  padding: 0.25rem;
`;

const MessageContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 15px 20px;

  width: fit-content;
  min-width: 90px;
  max-width: 100%;

  background: var(--secondary-color);
  color: var(--text-color);
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(33, 33, 33, 0.1);
`;

const TimeTag = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  font-weight: 400;
  color: var(--text-color);
  width: 100%;
  text-align: right;
  /* letter-spacing: -2%; */
`;

const Text = styled.p`
  line-height: 1.4;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -2%;
  color: var(--text-color);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: pre-wrap;
`;
