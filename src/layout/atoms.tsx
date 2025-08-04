import { motion } from "framer-motion";
import styled from "styled-components";
import { FillRow } from ".";
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="56"
      fill="none"
      viewBox="0 0 80 56"
      style={{
        mixBlendMode: "difference",
        minHeight: "56px",
        minWidth: "80px",
      }}
    >
      <g clipPath="url(#clip0_2458_55)">
        <path
          stroke="currentColor"
          strokeWidth="2.24"
          d="M17.662 41.393c7.1.928 14.293-3.614 14.6-11.446.824-7.61-4.312-14.26-11.631-14.778-7.387-.716-13.947 4.306-14.545 11.416C5.062 34.51 10.5 40.458 17.662 41.393zM46.807 45.2c7.101.927 14.293-3.615 14.6-11.447.824-7.61-4.311-14.26-11.63-14.777-7.387-.717-13.948 4.305-14.546 11.415-1.023 7.925 4.415 13.873 11.576 14.809z"
        ></path>
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M60.148 35.531c.775-1.175 3.846-5.117 6.883-8.065 1.54-1.495 2.955-2.619 3.994-3.064.53-.227.753-.186.79-.173h.001c.002 0 .013.002.04.037.037.048.105.163.166.402.153.602.762.973 1.36.828.598-.145.959-.75.806-1.353-.231-.91-.741-1.707-1.659-2.03-.83-.293-1.697-.081-2.407.223-1.442.618-3.105 1.998-4.658 3.506-1.85 1.795-3.707 3.938-5.1 5.667.032.7.01 1.418-.07 2.145a12.017 12.017 0 01-.239 2c.033-.039.065-.08.093-.123zM30.5 33.314a1.09 1.09 0 00.358-.341c1.153-1.75 4.106-1.69 5.159.736.073.17.183.312.316.423a13.943 13.943 0 01.002-3.54 5.238 5.238 0 00-5.192-.672 11.605 11.605 0 01-.644 3.394z"
          clipRule="evenodd"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.24"
          d="M33.571 37.853c-3.192 3.47-8.126 13.834.211 11.285M19.102 9.7c2.278-2.09 7.856-2.02 10.263 2.18M55.95 15.303c-1.736-2.615-7.164-3.982-10.453-.527"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_2458_55">
          <path
            fill="#fff"
            d="M0 0H78.4V56H0z"
            transform="translate(.8)"
          ></path>
        </clipPath>
      </defs>
    </svg>
  );
};

export const MotionWrapper = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
  margin: 0;
  overflow: none;
  max-width: 100%;
  width: 100%;
`;

export const MotionIconWrapper = styled(FillRow)`
  all: inherit;
  position: relative;

  height: fit-content;
  width: fit-content;
  margin: 0;
  gap: 8px;

  overflow: unset;
`;

export const IconButton = styled(motion.button)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
  margin: 0;
  padding: 12px;
  border: 0;
  outline: 0;

  border-radius: 50px;
  background-color: rgba(18, 18, 18, 0.05);
  color: #121212;

  transition: background-color 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);

  > * {
    transition: scale 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  }

  &:hover {
    cursor: pointer;
    background-color: rgba(18, 18, 18, 0.08);

    > * {
      scale: 1.14;
    }
  }

  &:active {
    cursor: pointer;
    background-color: rgba(18, 18, 18, 0.1);

    > * {
      scale: 1;
    }
  }
`;

export const Button = styled(motion.button)<{
  variant?: "primary" | "secondary";
}>`
  display: flex;
  width: 100%;
  max-width: 100%;
  padding: 20px 30px;
  height: 58px;

  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 24px;
  background: #121212;
  color: #fff;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  line-height: normal;
  letter-spacing: 1.5px;
  font-family: "Open Sauce Two";
  text-transform: uppercase;

  box-shadow: 0px 0px 0px 0px #000;
  transition: 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  transition-property: box-shadow height;
  overflow: hidden;

  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 0px 4px #121212;
  }

  &:active {
    box-shadow: 0px 0px 0px 0px #121212;
  }
`;

export const RoundIconButton = styled(Button)`
  height: 44px;
  width: 44px;
  padding: 0;
  z-index: 5;
`;

export const IconLink = styled(motion.create(Link))`
  text-decoration: none;
`;

export const MenuButton = styled(Button)`
  position: absolute;
  z-index: 100;
  top: 16px;
  bottom: unset;
  right: 0;
  left: 0;
  margin: 0 auto;
  width: fit-content;

  background: rgba(100, 100, 100, 0.6);
  backdrop-filter: blur(5px);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.3) inset,
    0 -1px 6px 0 rgba(0, 0, 0, 0.1) inset;

  color: #ffffff;
  pointer-events: auto;

  &:active,
  &:hover {
    &:hover {
      background-color: rgba(0, 0, 0, 0.25);
      box-shadow: none;
    }
  }

  > span {
    display: flex;
    align-items: center;
    justify-content: center;
    height: fit-content;
    width: fit-content;
  }
`;

export const SensorButton = styled(MenuButton)`
  position: absolute;
  z-index: 100;
  left: 0;
  top: unset;
  right: 0;
  bottom: 100px;
  box-shadow: none;

  margin: 0 auto;
  width: fit-content;
  pointer-events: auto;
`;
