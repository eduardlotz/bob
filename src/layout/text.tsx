import { motion } from "framer-motion";
import styled from "styled-components";

export const H2 = styled(motion.h2)`
  color: #121212;
  font-size: 26px;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: -0.52px;

  margin: 0;
  max-width: 740px;
`;

export const BottomText = styled(motion.p)`
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: -0.28px;

  margin: 0;
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
