import { FillRow, HugColumn } from "@/layout";
import { useMessageStore } from "@/store/messageStore";
import { format } from "date-fns/format";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import styled from "styled-components";

export const ChatIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3758_748)">
      <rect
        width={100}
        height={100}
        rx={30}
        fill="url(#paint0_linear_3758_748)"
      />
    </g>
    <g filter="url(#filter1_ii_3758_748)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33.4527 32.0964C37.5206 28.0285 43.3867 26.002 50.5726 26.002C57.7584 26.002 63.6246 28.0285 67.6924 32.0964C71.7603 36.1643 73.7867 42.0304 73.7867 49.2162C73.7867 56.4021 71.7603 62.2682 67.6924 66.336C63.6246 70.4039 57.7584 72.4307 50.5726 72.4307C46.6199 72.4307 43.0688 71.8192 39.99 70.5874L30.536 73.7389C27.7017 74.6835 25.0292 71.9378 26.0502 69.1299L29.3295 60.1121C28.0119 56.9617 27.3583 53.3034 27.3583 49.2162C27.3583 42.0304 29.3848 36.1643 33.4527 32.0964ZM50.7936 52.5599C52.5148 52.5599 53.9101 51.1646 53.9101 49.4433C53.9101 47.7221 52.5148 46.3268 50.7936 46.3268C49.0723 46.3268 47.6769 47.7221 47.6769 49.4433C47.6769 51.1646 49.0723 52.5599 50.7936 52.5599ZM42.5637 49.4433C42.5637 51.1646 41.1683 52.5599 39.4471 52.5599C37.7259 52.5599 36.3305 51.1646 36.3305 49.4433C36.3305 47.7221 37.7259 46.3268 39.4471 46.3268C41.1683 46.3268 42.5637 47.7221 42.5637 49.4433ZM62.1382 52.5599C63.8596 52.5599 65.2549 51.1646 65.2549 49.4433C65.2549 47.7221 63.8596 46.3268 62.1382 46.3268C60.4171 46.3268 59.0217 47.7221 59.0217 49.4433C59.0217 51.1646 60.4171 52.5599 62.1382 52.5599Z"
        fill="url(#paint1_linear_3758_748)"
      />
    </g>
    <defs>
      <filter
        id="filter0_ii_3758_748"
        x={0}
        y={-2.5}
        width={100}
        height={102.5}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3758_748"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.0483713 0 0 0 0 0.183741 0 0 0 0 0.510222 0 0 0 0.64 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_748"
          result="effect2_innerShadow_3758_748"
        />
      </filter>
      <filter
        id="filter1_ii_3758_748"
        x={25.8281}
        y={23.502}
        width={47.9609}
        height={50.4268}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3758_748"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.466667 0 0 0 0 0.968627 0 0 0 0.4 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_748"
          result="effect2_innerShadow_3758_748"
        />
      </filter>
      <linearGradient
        id="paint0_linear_3758_748"
        x1={50}
        y1={0}
        x2={50}
        y2={100}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#4277F7" />
        <stop offset={1} stopColor="#274691" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_3758_748"
        x1={49.8074}
        y1={26.002}
        x2={50.0322}
        y2={74.9998}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#D7E0FF" />
        <stop offset={1} stopColor="#97ADFA" />
      </linearGradient>
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
          background: "rgba(33, 33, 33, 0.05)",
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
