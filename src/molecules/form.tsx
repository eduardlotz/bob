import { MotionVariants } from "@/styles/motion";
import { motion } from "framer-motion";
import styled from "styled-components";

interface PasswordFieldProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
}

export const PasswordField = ({
  value,
  onChange,
  placeholder,
}: PasswordFieldProps) => {
  return (
    <PasswordInput
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      type="password"
      layout="position"
      variants={MotionVariants.SpringScaleReversed}
      animate="animate"
      exit="exit"
      initial="initial"
    />
  );
};

const PasswordInput = styled(motion.input)`
  display: flex;
  padding: 16px 30px;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  align-items: center;
  gap: 10px;
  z-index: 10;

  border-radius: 50px;
  background: #fff;
  /* border: 2px solid #e7e7e7; */
  border: none;
  box-shadow: 0px 0px 0px 2px #e7e7e7;

  color: #121212;

  text-align: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: 1.6px;
  text-transform: uppercase;

  transition: 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  transition-property: box-shadow;

  @media (max-width: 800px) {
    font-size: 16px;
  }

  &::placeholder {
    color: rgba(18, 18, 18, 0.5);
  }

  &:hover {
    box-shadow: 0px 0px 0px 8px #e7e7e7;
  }

  &:focus {
    border-color: #121212;
    outline: none;
    box-shadow: 0px 0px 0px 2px #121212;
  }
`;

export const MiniForm = styled(motion.form)`
  width: 100%;
  position: relative;
  overflow: none;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 12px;

  max-width: calc(100% 40px);
`;
