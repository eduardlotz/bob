import { useEffect, useState } from "react";
import { motion } from "motion/react";
import styled, { css } from "styled-components";
import { formatPrice } from "@/utils/formatNumber";

export const statusPillStyles = css`
  font-size: 1rem;
  font-weight: 900;
  color: #212121;
  background: rgba(33, 33, 33, 0.08);
  padding: 8px 12px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  height: 2.25rem;
`;

export const StatusPill = styled(motion.div)`
  ${statusPillStyles}
  gap: 4px;
  white-space: nowrap;
`;

export function TimeChip() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <StatusPill layout="position" style={{ gap: 0 }}>
    {String(time.getHours()).padStart(2, "0")}<Blinking>:</Blinking>{String(time.getMinutes()).padStart(2, "0")}
  </StatusPill>;
}

const Blinking = styled.span`
  padding-left: 0.1ch;
  padding-right: 0.05ch;
  animation: time-chip-blinking linear 3s infinite;
  @keyframes time-chip-blinking {
    0%, 50% { opacity: 0; }
    51%, 100% { opacity: 1; }
  }
`;

/** Shared with the upgrade price bubble; callers own positioning and animation. */
export const priceTagStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: 100%;
  min-height: 1.375rem;
  padding: 4px 8px;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 900;
  line-height: 1.25;
  text-align: center;
  white-space: nowrap;
`;

const PriceSurface = styled.span`
  ${priceTagStyles}
  gap: 3px;
  background: #f5ff42;
  color: #212121;
`;

export function PriceTag({ value, className }: { value: number; className?: string }) {
  return <PriceSurface className={className}>{formatPrice(value)} <span aria-hidden="true">🫵</span></PriceSurface>;
}
