import { FillRow, HugColumn } from "@/layout";
import { useMessageStore } from "@/store/messageStore";
import { format } from "date-fns/format";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import styled from "styled-components";

export const ChatIcon = () => (
  <img src={"/images/app-logos/chat.png"} height={80} width={80} />
);

export const ChatApp = () => {
  const { archive } = useMessageStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight + 8, //0.25rem gap
    });
  }, []);

  return (
    <>
      <FillRow $align="center" $justify="center">
        <AppInfo>Archiv für alte Nachrichten</AppInfo>
      </FillRow>

      <HugColumn
        style={{
          width: "360px",
          maxWidth: "100%",
          maxHeight: "23rem",
          overflowY: "auto",
          borderRadius: "1.75rem",
          background: "rgba(33, 33, 33, 0.15)",
          padding: "0.25rem",
        }}
        $gap={"0.25rem"}
        ref={containerRef}
        layoutRoot
      >
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
      </HugColumn>
    </>
  );
};

const AppInfo = styled.p`
  font-size: 0.875rem;
  font-weight: 400;
  color: #212121;
  opacity: 0.5;
  padding: 0.25rem;
  margin: 0 1rem;
  text-wrap: balance;
  text-align: center;
  line-height: 1.25;
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

  background: var(--chat-color);
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
