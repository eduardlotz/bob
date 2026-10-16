import { FillRow, HugColumn } from "@/layout";
import { getMessageById } from "@/messages/config";
import { useMessageStore } from "@/store/messageStore";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n";

export const ChatIcon = () => (
  <img src={"/images/app-logos/chat.png"} height={80} width={80} />
);

export const ChatApp = () => {
  const { archive } = useMessageStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale, formatDate } = useI18n();

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight + 8, //0.25rem gap
    });
  }, []);

  return (
    <>
      <HugColumn
        style={{
          width: "360px",
          maxWidth: "100%",
          maxHeight: "23rem",
          overflowY: "auto",
          borderRadius: "1.75rem",
          background: "rgba(33, 33, 33, 0.05)",
          padding: "0.25rem",
        }}
        $gap={"0.25rem"}
        ref={containerRef}
        layoutRoot
      >
        {archive.map((msg, i) => {
          const localizedMessage = msg.messageId
            ? getMessageById(msg.messageId, locale)
            : undefined;
          const text =
            localizedMessage &&
            typeof msg.messageLineIndex === "number" &&
            localizedMessage.text[msg.messageLineIndex]
              ? localizedMessage.text[msg.messageLineIndex]
              : msg.text;
          const sender = localizedMessage?.label ?? msg.sender;

          return (
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
              <Text>{text}</Text>

              <TimeTag>
                {sender ? `${sender} · ` : ""}
                {formatDate(msg.time)}
              </TimeTag>
            </MessageContainer>
          );
        })}
      </HugColumn>
    </>
  );
};

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
`;

const TimeTag = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  font-weight: 800;
  color: var(--text-color);
  width: 100%;
  text-align: right;
`;

const Text = styled.p`
  line-height: 1.4;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -1%;
  color: var(--text-color);
  white-space: pre-wrap;
`;
