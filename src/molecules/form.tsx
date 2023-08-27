import { motion } from "framer-motion";
import { InputHTMLAttributes } from "react";
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
    />
  );
};

const PasswordInput = styled.input`
  display: flex;
  height: 44px;
  padding: 12px 20px;
  min-width: 260px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 50px;
  background: #fff;
  border: 2px solid transparent;

  color: #121212;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;

  transition: border-color 0.25s ease-out;

  &:focus {
    border-color: #121212;
    outline: none;
  }
`;

export const MiniForm = styled(motion.form)`
  width: 100%;
  position: relative;
`;
