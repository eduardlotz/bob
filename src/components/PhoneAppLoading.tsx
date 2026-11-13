import styled from "styled-components";
import { motion, useReducedMotion } from "motion/react";
import { FloatingActionButton } from "./FloatingActionButton";
import { phoneAppSurface } from "@/styles/phoneAppSurface";
import { useI18n } from "@/i18n";

export function PhoneAppLoading({ name, failed, onRetry }: {
  name: string;
  failed: boolean;
  onRetry: () => void;
}) {
  const { messages } = useI18n();
  const reducedMotion = useReducedMotion();
  return <LoadingSurface role={failed ? "alert" : "status"} aria-busy={!failed}
    aria-label={failed ? undefined : `${name} · ${messages.loader.loading}`} data-phone-app-loading>
    {failed ? <>
      <p>{messages.phone.appLoadError}</p>
      <RetryButton type="button" $variant="blue" onClick={onRetry}>{messages.main.errorBoundary.retry}</RetryButton>
    </> : <Dots aria-hidden="true" animate={{ rotate: reducedMotion ? 0 : 360 }}
      transition={{ type: "spring", duration: 0.8, bounce: 0.3, repeat: reducedMotion ? 0 : Infinity }}>
      <Dot /><Dot />
    </Dots>}
  </LoadingSurface>;
}

const LoadingSurface = styled.div`
  ${phoneAppSurface}
  width: min(18rem, calc(100vw - 56px));
  min-height: min(232px, calc(100dvh - 160px));
  max-height: calc(100dvh - 160px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #78758d;
  p { font-size: 0.85rem; font-weight: 700; text-align: center; line-height: 1.5; }
`;

const Dots = styled(motion.span)`
  display: flex; align-items: center; gap: 10px; color: #212121;
`;
const Dot = styled.span`
  display: block; width: 10px; height: 10px; border-radius: 50%; background: currentColor;
`;

const RetryButton = styled(FloatingActionButton)`
  padding: 10px 16px;
  font-size: 0.85rem;
`;
