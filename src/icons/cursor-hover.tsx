import { IconProps } from "./types";

export const CursorHoverIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={32}
      height={34}
      viewBox="0 0 48 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_3506_4844)">
        <path
          d="M11.6301 29.4123C11.6301 29.4123 13.7891 31.2266 20.2891 35.2266C26.7891 39.2266 34.7891 33.7266 36.0204 31.581C37.2517 29.4354 37.1832 27.8719 37.0165 25.9353C36.631 20.4079 31.2141 17.4962 25.3463 18.1955C25.0745 18.2279 24.8207 18.045 24.7759 17.775L23.4995 10.0705C23.3499 9.18466 22.8555 8.39412 22.1246 7.87176C21.3937 7.3494 20.4857 7.13773 19.5991 7.28304C18.7125 7.42835 17.9196 7.91881 17.3937 8.64717C16.8677 9.37553 16.6516 10.2825 16.7926 11.1698L18.8581 23.9452C18.9103 24.2683 18.6432 24.5536 18.3174 24.5228L13.4758 24.0652C12.8259 24.0031 12.1739 24.1613 11.6248 24.5144C11.0757 24.8676 10.6613 25.3952 10.4483 26.0123C10.2353 26.6294 10.236 27.3003 10.4503 27.917C10.6647 28.5337 11.0802 29.0603 11.6301 29.4123Z"
          fill="#212121"
          stroke="white"
          strokeWidth={2.28571}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_3506_4844"
          x={-1.85379}
          y={-0.868675}
          width={50.2857}
          height={50.8482}
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
          <feOffset dy={3.04762} />
          <feGaussianBlur stdDeviation={4.57143} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0 0.129412 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3506_4844"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3506_4844"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};
