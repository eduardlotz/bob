import { IconProps } from "./types";

export const CursorIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_3504_4780)">
        <path
          d="M16.9958 7.38959C16.9958 6.2636 6.16383 2.05651 4.77435 3.44493C3.38777 4.83045 7.65151 15.6666 8.76957 15.6666C10.0728 15.6666 10.8385 10.7024 11.1471 9.81283C12.0333 9.49974 16.9958 8.69762 16.9958 7.38959Z"
          fill="#212121"
        />
        <path
          d="M16.9958 7.38959C16.9958 6.2636 6.16383 2.05651 4.77435 3.44493C3.38777 4.83045 7.65151 15.6666 8.76957 15.6666C10.0728 15.6666 10.8385 10.7024 11.1471 9.81283C12.0333 9.49974 16.9958 8.69762 16.9958 7.38959Z"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_3504_4780"
          x={-0.25}
          y={-0.249674}
          width={22}
          height={22}
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
          <feOffset dy={1.33333} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3504_4780"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3504_4780"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};
