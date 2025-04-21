import { motion } from "framer-motion";
import styled from "styled-components";

export const H2 = styled(motion.h2)`
  color: #121212;
  font-size: 2.25rem;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
  letter-spacing: -0.05em;

  margin: 0;
  width: clamp(740px, 20vw, 100%);
  max-width: 100%;
  font-family: "Lora", serif;
`;

export const BottomText = styled(motion.p)`
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  font-style: normal;
  text-align: left;
  letter-spacing: -0.02em;
  font-weight: 400;
  line-height: 130%;

  font-family: "Lora";
  margin: 0 auto;
  margin-bottom: 16px;
  width: 100%;
  max-width: 740px;
`;

export const UppercaseText = styled.p`
  color: #121212;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  margin: 0;
  max-width: 740px;
`;
