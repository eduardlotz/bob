import { IconProps } from "./types";

export const CursorClickIcon = ({ color }: IconProps) => {
  return (
    <svg
      width={32}
      height={33}
      viewBox="0 0 48 49"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_3507_4848)">
        <path
          d="M11.6301 28.4123C11.6301 28.4123 13.7891 30.2266 20.2891 34.2266C26.7891 38.2266 34.7891 32.7266 36.0204 30.581C37.2517 28.4354 37.1832 26.8719 37.0165 24.9353C36.6313 19.4126 31.2234 16.5012 25.3614 17.1937C25.0837 17.2265 24.8253 17.0359 24.7812 16.7597C24.6383 15.866 24.2965 13.9765 23.7891 12.7266C23.1969 11.2679 23.2588 11.4627 22.7891 10.7266C21.9687 9.44102 20.8555 8.39412 20.1246 7.87176C19.3937 7.3494 18.4857 7.13773 17.5991 7.28304C16.7125 7.42835 15.9196 7.91881 15.3937 8.64717C14.8677 9.37553 14.833 10.3224 15.2891 11.2266C15.8901 12.4182 16.9296 13.4544 17.7891 15.2266C18.9561 17.6329 19.001 21.6371 18.9764 23.0612C18.9715 23.3461 18.7243 23.5612 18.4406 23.5344L13.4758 23.0652C12.8259 23.0031 12.1739 23.1613 11.6248 23.5144C11.0757 23.8676 10.6613 24.3952 10.4483 25.0123C10.2353 25.6294 10.236 26.3003 10.4503 26.917C10.6647 27.5337 11.0802 28.0603 11.6301 28.4123Z"
          fill="#212121"
          stroke="white"
          strokeWidth={2.28571}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_3507_4848"
          x={-1.85379}
          y={-1.86868}
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
            result="effect1_dropShadow_3507_4848"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3507_4848"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};
