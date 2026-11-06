import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styled, { keyframes } from "styled-components";
import { chatBubbleStyles, chatTextStyles } from "@/styles/chatBubble";
import { phoneAppSurface } from "@/styles/phoneAppSurface";
import { useI18n } from "@/i18n";
import { HELP_START_TOPICS, helpCopy, helpDataset, type HelpTopicId } from "./help.data";

type HelpExchange = { topic: HelpTopicId; status: "typing" | "answered" };
const REPLY_DELAY = 1000;

export function HelpApp() {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion();
  const [history, setHistory] = useState<HelpExchange[]>([]);
  const [showTopics, setShowTopics] = useState(true);
  const [conversationHeight, setConversationHeight] = useState<number>();
  const conversationRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const sendingRef = useRef(false);
  const copy = helpCopy[locale];
  const dataset = helpDataset[locale];
  const lastExchange = history[history.length - 1];
  const pending = !!lastExchange && lastExchange.status !== "answered";
  const choices = showTopics || !lastExchange ? HELP_START_TOPICS : dataset[lastExchange.topic].next;

  useEffect(() => {
    if (!pending) return;
    const replyTimer = window.setTimeout(() => {
      setHistory(previous => previous.map((exchange, index) => index === previous.length - 1 ? { ...exchange, status: "answered" } : exchange));
      sendingRef.current = false;
    }, REPLY_DELAY);
    return () => clearTimeout(replyTimer);
  }, [pending]);

  useLayoutEffect(() => {
    if (lastExchange?.status !== "typing") return;
    const conversation = conversationRef.current;
    const question = questionRef.current;
    if (!conversation || !question) return;
    // Follow the sent question, keeping it visible when the answer arrives.
    const top = conversation.scrollTop + question.getBoundingClientRect().top - conversation.getBoundingClientRect().top;
    const height = Math.ceil(top + conversation.clientHeight);
    if ((conversationHeight ?? 0) < height) {
      // Reserve the reply's space before scrolling so the question stays in view
      // when the typing indicator is replaced by the answer and follow-ups.
      setConversationHeight(height);
      return;
    }
    conversation.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
  }, [lastExchange?.status, reducedMotion, conversationHeight]);

  const sendQuestion = (topic: HelpTopicId) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    // Retain the scroll range while the question replaces the choices.
    setConversationHeight(conversationRef.current?.scrollHeight);
    setHistory(previous => [...previous, { topic, status: "typing" }]);
    setShowTopics(false);
    conversationRef.current?.focus({ preventScroll: true });
  };

  return <HelpRoot data-help-app>
      <Conversation ref={conversationRef} role="log" aria-label={copy.conversation} aria-live="polite" aria-relevant="additions" tabIndex={0}>
        <ConversationContent style={{ minHeight: conversationHeight }}>
          <Reply>{copy.greeting}</Reply>
          {history.map(({ topic, status }, index) => <Exchange key={`${index}-${topic}`} data-help-status={status}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
            <Question ref={index === history.length - 1 ? questionRef : undefined}>
              {dataset[topic].question}
            </Question>
            <AnimatePresence mode="wait" initial={false}>
              {status === "typing" && <TypingBubble key="typing" role="status" aria-label={copy.writing}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}>
                <Dot $delay={0} /><Dot $delay={0.15} /><Dot $delay={0.3} />
              </TypingBubble>}
              {status === "answered" && <Reply key="reply" initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>{dataset[topic].answer}</Reply>}
            </AnimatePresence>
          </Exchange>)}
          {!pending && <Choices role="group" aria-label={copy.topics}>
            {choices.map(topic => <TopicButton key={topic} type="button" data-ui-sound-id="ui-tap" onClick={() => sendQuestion(topic)}>
              {dataset[topic].question}
            </TopicButton>)}
            {!showTopics && <MoreButton type="button" data-ui-sound-id="ui-tap" onClick={() => {
              setShowTopics(true);
              conversationRef.current?.focus({ preventScroll: true });
            }}>{copy.more}</MoreButton>}
          </Choices>}
        </ConversationContent>
      </Conversation>
  </HelpRoot>;
}

const HelpRoot = styled.div`
  ${phoneAppSurface}
  width: min(360px, calc(100vw - 48px)); height: min(27rem, calc(100dvh - 164px));
  min-height: 160px; overflow: hidden;
`;
const Conversation = styled.div`
  height: 100%; overflow-y: auto; overflow-anchor: none;
  overscroll-behavior: contain; scrollbar-width: thin;
  &:focus-visible { outline: 2px solid #4178f7; outline-offset: -3px; }
`;
const ConversationContent = styled.div`
  display: flex; flex-direction: column; gap: 16px; min-height: 100%;
`;
const Exchange = styled(motion.div)`display: flex; flex-direction: column; align-items: flex-start; gap: 16px;`;
const Reply = styled(motion.p)`
  ${chatBubbleStyles}
  ${chatTextStyles}
  align-self: flex-start;
  flex-shrink: 0;
`;
const Question = styled(Reply)`align-self: flex-end;`;
const Choices = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: auto; padding-top: 4px;`;
const TopicButton = styled.button`
  max-width: 100%; border-radius: 20px; border: 1px solid #21212140; padding: 10px 14px;
  color: #212121; background: transparent; font-size: 0.8rem; font-weight: 750; line-height: 1.35; text-align: left;
  &:hover { background: #21212108; }
  &:focus-visible { outline: 2px solid #4178f7; outline-offset: 2px; }
`;
const MoreButton = styled(TopicButton)``;
const TypingBubble = styled(motion.div)`
  background: rgba(33, 33, 33, 0.08); padding: 12px 16px; border-radius: 24px;
  display: flex; gap: 4px; align-items: center; height: 40px; flex-shrink: 0;
`;
const dotBounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;
const Dot = styled.span<{ $delay: number }>`
  width: 6px; height: 6px; background: rgba(33, 33, 33, 0.5); border-radius: 50%;
  animation: ${dotBounce} 1.4s infinite ease-in-out both;
  animation-delay: ${({ $delay }) => $delay}s;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
