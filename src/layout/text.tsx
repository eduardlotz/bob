import { motion } from "framer-motion";
import styled from "styled-components";

export const H2 = styled(motion.h2)`
  color: #000;
  font-size: 26px;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: -0.52px;

  margin: 0;
  max-width: width: 740px;
`;

export const BottomText = styled(motion.p)`
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: -0.28px;
  
  margin: 0;
  max-width: width: 740px;
`;
