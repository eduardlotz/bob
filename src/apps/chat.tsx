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
    <rect
      x={1}
      y={1}
      width={78}
      height={78}
      rx={23}
      fill="#4277F7"
      stroke="#4147D5"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2704)">
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        fill="#D7E0FF"
      />
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.1914 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.5312 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48.875 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2704">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(19.6641 20.416)"
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
  border-radius: 24px;
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
