interface IconProps {
  color?: string;
}

export const LockIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      d="M6.513 3.55c-.576 1.024-.68 2.243-.68 3.117H5a2.5 2.5 0 00-2.5 2.5v6.667a2.5 2.5 0 002.5 2.5h10a2.5 2.5 0 002.5-2.5V9.167a2.5 2.5 0 00-2.5-2.5h-.833c0-.874-.104-2.093-.68-3.117a3.546 3.546 0 00-1.318-1.354c-.596-.346-1.318-.529-2.169-.529-.85 0-1.573.183-2.17.529A3.547 3.547 0 006.514 3.55zm1.453.817c-.362.643-.466 1.508-.466 2.3h5c0-.792-.104-1.657-.466-2.3a1.882 1.882 0 00-.7-.73c-.303-.174-.726-.303-1.334-.303-.607 0-1.031.129-1.333.304a1.882 1.882 0 00-.701.73zm3.7 7.3c0 .617-.335 1.155-.833 1.443v1.057a.833.833 0 01-1.667 0V13.11a1.666 1.666 0 112.5-1.443z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export const CheckmarkIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill={color ?? "currentColor"}
      fillRule="evenodd"
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm4.707-11.293a1 1 0 00-1.414-1.414L11 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5z"
      clipRule="evenodd"
    />
  </svg>
);

export const DownloadIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke={color ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 19h14M12 5v8.167m-3.5-2.334l3.5 3.5 3.5-3.5"
    />
  </svg>
);

export const ArrowRightIcon = ({ color }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke={color ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 12h14m0 0l-5.25 5M19 12l-5.25-5"
    />
  </svg>
);
