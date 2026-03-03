import { FillColumn, FillRow, HugColumn } from "@/layout";
import { CameraViewId, useQuestStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import styled from "styled-components";

export const QuestsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3758_762)">
      <rect
        width={100}
        height={100}
        rx={30}
        fill="url(#paint0_linear_3758_762)"
      />
    </g>
    <g clipPath="url(#clip0_3758_762)">
      <g filter="url(#filter1_dii_3758_762)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32.126 32.1807C28.2859 36.0208 26.0091 41.8909 26.0091 50.0238C26.0091 58.1568 28.2859 64.027 32.126 67.8669C35.9661 71.7073 41.8362 73.9838 49.9691 73.9838C58.1021 73.9838 63.9721 71.7073 67.8124 67.8669C71.6523 64.027 73.9293 58.1568 73.9293 50.0238C73.9293 48.1315 75.4634 46.5974 77.3557 46.5974C79.248 46.5974 80.7821 48.1315 80.7821 50.0238C80.7821 59.4182 78.1292 67.2415 72.6578 72.7128C67.1865 78.1841 59.3635 80.8366 49.9691 80.8366C40.5748 80.8366 32.7516 78.1841 27.2803 72.7128C21.809 67.2415 19.1562 59.4182 19.1562 50.0238C19.1562 40.6295 21.809 32.8063 27.2803 27.335C32.7516 21.8637 40.5748 19.2109 49.9691 19.2109C51.8615 19.2109 53.3956 20.745 53.3956 22.6374C53.3956 24.5297 51.8615 26.0638 49.9691 26.0638C41.8362 26.0638 35.9661 28.3406 32.126 32.1807ZM48.9291 35.4804C49.3479 37.3259 48.1914 39.1614 46.3459 39.5803C43.8724 40.1416 42.1757 41.2887 41.0561 42.8467C39.9086 44.4436 39.1549 46.7726 39.1549 50.0218C39.1549 53.9482 40.2486 56.5319 41.8539 58.1373C43.4593 59.7427 46.043 60.8363 49.9694 60.8363C53.3778 60.8363 55.7729 60.0081 57.3783 58.7605C58.9488 57.54 60.0956 55.6623 60.5612 52.8809C60.8736 51.0145 62.6399 49.7547 64.5061 50.0672C66.3729 50.3796 67.6324 52.1459 67.3199 54.0122C66.62 58.1942 64.7318 61.7247 61.5834 64.1714C58.4698 66.5909 54.4622 67.6892 49.9694 67.6892C44.7816 67.6892 40.2448 66.2195 37.0083 62.983C33.7717 59.7464 32.302 55.2096 32.302 50.0218C32.302 45.7397 33.2987 41.8987 35.4911 38.8477C37.7114 35.7578 40.9443 33.779 44.8292 32.8973C46.6747 32.4785 48.5102 33.635 48.9291 35.4804ZM63.2562 43.7737C62.0594 43.6964 60.8333 44.0038 59.9853 44.8519L52.3924 52.4447C51.0543 53.7828 48.8848 53.7828 47.5467 52.4447C46.2086 51.1066 46.2086 48.9371 47.5467 47.599L55.1424 40.0033C55.99 39.1557 56.2976 37.9303 56.2208 36.7341C56.0131 33.4994 57.1914 30.2777 59.5428 27.9261L66.4948 20.974C67.0609 20.4077 67.8828 20.1793 68.6599 20.3721C69.437 20.5649 70.057 21.1507 70.2927 21.916L71.5898 26.122C71.9265 27.2135 72.781 28.0679 73.8725 28.4046L78.0784 29.7016C78.8437 29.9377 79.4294 30.5572 79.6222 31.3345C79.815 32.1118 79.587 32.9334 79.0205 33.4997L72.069 40.4517C69.7161 42.8043 66.4923 43.9826 63.2562 43.7737Z"
          fill="#212121"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32.126 32.1807C28.2859 36.0208 26.0091 41.8909 26.0091 50.0238C26.0091 58.1568 28.2859 64.027 32.126 67.8669C35.9661 71.7073 41.8362 73.9838 49.9691 73.9838C58.1021 73.9838 63.9721 71.7073 67.8124 67.8669C71.6523 64.027 73.9293 58.1568 73.9293 50.0238C73.9293 48.1315 75.4634 46.5974 77.3557 46.5974C79.248 46.5974 80.7821 48.1315 80.7821 50.0238C80.7821 59.4182 78.1292 67.2415 72.6578 72.7128C67.1865 78.1841 59.3635 80.8366 49.9691 80.8366C40.5748 80.8366 32.7516 78.1841 27.2803 72.7128C21.809 67.2415 19.1562 59.4182 19.1562 50.0238C19.1562 40.6295 21.809 32.8063 27.2803 27.335C32.7516 21.8637 40.5748 19.2109 49.9691 19.2109C51.8615 19.2109 53.3956 20.745 53.3956 22.6374C53.3956 24.5297 51.8615 26.0638 49.9691 26.0638C41.8362 26.0638 35.9661 28.3406 32.126 32.1807ZM48.9291 35.4804C49.3479 37.3259 48.1914 39.1614 46.3459 39.5803C43.8724 40.1416 42.1757 41.2887 41.0561 42.8467C39.9086 44.4436 39.1549 46.7726 39.1549 50.0218C39.1549 53.9482 40.2486 56.5319 41.8539 58.1373C43.4593 59.7427 46.043 60.8363 49.9694 60.8363C53.3778 60.8363 55.7729 60.0081 57.3783 58.7605C58.9488 57.54 60.0956 55.6623 60.5612 52.8809C60.8736 51.0145 62.6399 49.7547 64.5061 50.0672C66.3729 50.3796 67.6324 52.1459 67.3199 54.0122C66.62 58.1942 64.7318 61.7247 61.5834 64.1714C58.4698 66.5909 54.4622 67.6892 49.9694 67.6892C44.7816 67.6892 40.2448 66.2195 37.0083 62.983C33.7717 59.7464 32.302 55.2096 32.302 50.0218C32.302 45.7397 33.2987 41.8987 35.4911 38.8477C37.7114 35.7578 40.9443 33.779 44.8292 32.8973C46.6747 32.4785 48.5102 33.635 48.9291 35.4804ZM63.2562 43.7737C62.0594 43.6964 60.8333 44.0038 59.9853 44.8519L52.3924 52.4447C51.0543 53.7828 48.8848 53.7828 47.5467 52.4447C46.2086 51.1066 46.2086 48.9371 47.5467 47.599L55.1424 40.0033C55.99 39.1557 56.2976 37.9303 56.2208 36.7341C56.0131 33.4994 57.1914 30.2777 59.5428 27.9261L66.4948 20.974C67.0609 20.4077 67.8828 20.1793 68.6599 20.3721C69.437 20.5649 70.057 21.1507 70.2927 21.916L71.5898 26.122C71.9265 27.2135 72.781 28.0679 73.8725 28.4046L78.0784 29.7016C78.8437 29.9377 79.4294 30.5572 79.6222 31.3345C79.815 32.1118 79.587 32.9334 79.0205 33.4997L72.069 40.4517C69.7161 42.8043 66.4923 43.9826 63.2562 43.7737Z"
          fill="url(#paint1_linear_3758_762)"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_ii_3758_762"
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
          result="effect1_innerShadow_3758_762"
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
          values="0 0 0 0 0.866667 0 0 0 0 0.278431 0 0 0 0 0.329412 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_762"
          result="effect2_innerShadow_3758_762"
        />
      </filter>
      <filter
        id="filter1_dii_3758_762"
        x={17.4293}
        y={16.0129}
        width={65.0789}
        height={67.4144}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={0.863467} />
        <feGaussianBlur stdDeviation={0.863467} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3758_762"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3758_762"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-3.198} />
        <feGaussianBlur stdDeviation={4.797} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3758_762"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.599} />
        <feGaussianBlur stdDeviation={1.599} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.992157 0 0 0 0 0.811765 0 0 0 0 0.0980392 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="effect2_innerShadow_3758_762"
          result="effect3_innerShadow_3758_762"
        />
      </filter>
      <linearGradient
        id="paint0_linear_3758_762"
        x1={50}
        y1={0}
        x2={50}
        y2={100}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EFD779" />
        <stop offset={1} stopColor="#EBBD07" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_3758_762"
        x1={49.9692}
        y1={19.2695}
        x2={49.9692}
        y2={80.8366}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FCF7E3" />
        <stop offset={1} stopColor="#EFD779" />
      </linearGradient>
      <clipPath id="clip0_3758_762">
        <rect
          width={63.96}
          height={63.96}
          fill="white"
          transform="translate(18.0156 18.0195)"
        />
      </clipPath>
    </defs>
  </svg>
);

export const QuestsApp = () => {
  const { quests } = useQuestStore();

  return (
    <HugColumn style={{ width: "320px", maxWidth: "100%" }} $gap={"0.25rem"}>
      {quests.map((quest, index) => (
        <QuestListItem $completed={quest.completed} key={quest.id}>
          <FillColumn $align="flex-start" $gap={".25rem"}>
            <QuestName>{quest.title}</QuestName>
            <QuestInfos>{quest.description}</QuestInfos>
          </FillColumn>

          <QuestIcon
            animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
            initial={{ scale: 0, filter: "blur(4px)", opacity: 0 }}
            transition={{ delay: 0.5 + index * 0.2 }}
          >
            {quest.completed ? <QuestCheckmarkIcon /> : ""}
          </QuestIcon>
        </QuestListItem>
      ))}
    </HugColumn>
  );
};

const QuestCheckmarkIcon = () => (
  <svg
    width={32}
    height={32}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.35465 1.08218C6.721 0.767629 7.26188 0.768405 7.62808 1.08316C7.88705 1.30575 8.14151 1.52854 8.39176 1.7521C8.72463 1.68263 9.06083 1.61586 9.40055 1.55191C9.87506 1.46274 10.3433 1.73298 10.5031 2.18863C10.6161 2.51105 10.7243 2.83165 10.8293 3.15054C11.1523 3.2568 11.4767 3.36712 11.8029 3.4816C12.2586 3.64153 12.5291 4.10955 12.4396 4.58414C12.3752 4.9255 12.3082 5.26278 12.2384 5.59683C12.466 5.85142 12.6925 6.11056 12.9191 6.37418C13.2339 6.74045 13.2338 7.28127 12.9191 7.64762C12.6939 7.90978 12.468 8.16758 12.2414 8.42105C12.31 8.74964 12.3763 9.08147 12.4396 9.41715C12.529 9.89166 12.2585 10.3598 11.8029 10.5197C11.4767 10.6342 11.1523 10.7445 10.8293 10.8507C10.7243 11.1695 10.6151 11.4903 10.5021 11.8127C10.3422 12.2679 9.87485 12.5384 9.40055 12.4494C9.06661 12.3865 8.73566 12.3203 8.40836 12.2521C8.15912 12.4747 7.90623 12.6968 7.64859 12.9181C7.28223 13.2328 6.74142 13.2329 6.37515 12.9181C6.11615 12.6955 5.86176 12.4727 5.61148 12.2492C5.27857 12.3187 4.94246 12.3854 4.60269 12.4494C4.12819 12.5387 3.66007 12.2681 3.50015 11.8127C3.38712 11.4903 3.27798 11.1695 3.173 10.8507C2.84998 10.7445 2.52556 10.6342 2.19937 10.5197C1.74381 10.3597 1.47421 9.89163 1.56363 9.41715C1.62804 9.07555 1.69498 8.73776 1.7648 8.40348C1.53738 8.14908 1.31054 7.89053 1.08413 7.62711C0.769382 7.2609 0.768605 6.72003 1.08316 6.35367C1.3084 6.09145 1.53429 5.83378 1.76089 5.58023C1.69238 5.25162 1.62693 4.91982 1.56363 4.58414C1.47416 4.10967 1.74387 3.64164 2.19937 3.4816C2.5255 3.36714 2.85003 3.2568 3.173 3.15054C3.27798 2.83165 3.38711 2.51105 3.50015 2.18863C3.66 1.73298 4.12813 1.46257 4.60269 1.55191C4.93652 1.61476 5.2667 1.68002 5.5939 1.7482C5.84329 1.52546 6.09686 1.30361 6.35465 1.08218ZM9.37223 4.66421C9.1867 4.45969 8.86972 4.44451 8.66519 4.63004C7.93943 5.28843 7.39601 5.8785 6.93765 6.5939C6.5928 7.13218 6.30363 7.72953 6.01871 8.46109L4.98062 7.3898C4.78844 7.19161 4.47184 7.18698 4.27359 7.37906C4.07539 7.57125 4.06978 7.88784 4.26187 8.08609L5.85562 9.72867C5.97638 9.85282 6.15327 9.9057 6.32242 9.86832C6.49143 9.83072 6.62968 9.7086 6.68668 9.54508C7.05531 8.48614 7.38313 7.75266 7.77945 7.13394C8.17394 6.51821 8.65028 5.99416 9.33805 5.37027C9.54207 5.18482 9.55724 4.86863 9.37223 4.66421Z"
      fill="currentColor"
    />
  </svg>
);

const QuestIcon = styled(motion.div)`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;

  color: #4178f7;
`;

const QuestListItem = styled(FillRow)<{
  $completed?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: relative;

  padding: 1rem;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(33, 33, 33, 0.05);
  color: #212121;

  ${(p) =>
    p.$completed &&
    `
    background: rgba(65, 120, 247, 0.1);
    
    border: 1.5px solid #4178f7;

    h5 {
      color: #4178f7;
    }

    p {
      text-decoration: line-through;
    }
  `}

  h5 {
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.6;
  }
`;
const QuestName = styled.h5`
  text-wrap: balance;
  line-height: 1.15;
`;

const QuestInfos = styled.p`
  text-wrap: balance;
  line-height: 1.25;
`;
