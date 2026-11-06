import styled, { keyframes } from "styled-components";
import { FloatingActionButton } from "./FloatingActionButton";
import { phoneAppSurface } from "@/styles/phoneAppSurface";
import { useI18n } from "@/i18n";

export function PhoneAppLoading({ name, failed, onRetry }: {
  name: string;
  failed: boolean;
  onRetry: () => void;
}) {
  const { messages } = useI18n();
  return <LoadingSurface role={failed ? "alert" : "status"} aria-busy={!failed}
    aria-label={failed ? undefined : `${name} · ${messages.loader.loading}`} data-phone-app-loading>
    {failed ? <>
      <p>{messages.phone.appLoadError}</p>
      <RetryButton type="button" $variant="blue" onClick={onRetry}>{messages.main.errorBoundary.retry}</RetryButton>
    </> : <Eyes aria-hidden="true"><Eye $lean={-12} /><Eye $lean={12} /></Eyes>}
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

const blink = keyframes`
  0%, 44%, 50%, 100% { transform: scaleY(1); }
  47% { transform: scaleY(0.08); }
`;

const Eyes = styled.span`
  display: flex;
  align-items: center;
  gap: 14px;
  color: #212121;
`;

const Eye = styled.span<{ $lean: number }>`
  display: block;
  width: 10px;
  height: 14px;
  transform: skewX(${({ $lean }) => $lean}deg);
  &::before {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: currentColor;
    transform-origin: center;
    animation: ${blink} 2.5s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    &::before { animation: none; }
  }
`;

const RetryButton = styled(FloatingActionButton)`
  padding: 10px 16px;
  font-size: 0.85rem;
`;
