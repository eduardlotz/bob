import styled from "styled-components";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export const ExplorationPanel = styled(motion.section)`
  position: fixed; z-index: 110; right: 24px; top: 50%; transform: translateY(-50%);
  width: 300px; max-width: calc(100vw - 32px); max-height: min(68dvh, 640px); overflow: auto;
  pointer-events: auto; padding: 22px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.06);
  color: #212121; background: #f7f7f8; box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; gap: 14px;
  h2 { font-size: 25px; font-weight: 800; line-height: 1.2; overflow-wrap: anywhere; }
  p { font-size: 14px; line-height: 1.5; user-select: text; }
  small { font-size: 12px; font-weight: 800; color: #777; }
  img, canvas { max-width: 100%; border-radius: 10px; }
  @media (max-width: 760px) {
    top: auto; transform: none; bottom: 100px; right: 16px; left: 16px;
    width: auto; max-height: 32dvh; padding: 16px; gap: 10px;
    h2 { font-size: 21px; }
  }
`;

export const ExplorationButton = styled.button`
  pointer-events: auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  background: #fff; color: #212121; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
  padding: 10px 14px; box-shadow: none; font-weight: 600; font-size: 13px;
  text-decoration: none; line-height: 1.25;
  &:hover { background: #eeeef0; }
  &:active { background: #e5e5e8; }
  &:focus-visible { outline: 3px solid #4277f7; outline-offset: 3px; }
`;

export function ExplorationPanelHeader({ children, onClose, closeLabel }: { children: ReactNode; onClose: () => void; closeLabel: string }) {
  return <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    position: "sticky", top: 0, zIndex: 2, background: "#f7f7f8", paddingBottom: 4 }}>
    <small>{children}</small>
    <ExplorationButton onClick={onClose} style={{ flexShrink: 0, padding: "7px 11px" }}>← {closeLabel}</ExplorationButton>
  </header>;
}

export const ExplorationDock = styled.nav`
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 108px; z-index: 105;
  display: flex; gap: 8px; width: max-content; max-width: calc(100vw - 24px); overflow-x: auto; padding: 5px 3px 8px;
  pointer-events: auto;
  button { flex-shrink: 0; }
  @media (max-width: 760px) {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    width: calc(100vw - 24px); gap: 6px;
    button { padding: 7px 5px; font-size: 11px; min-height: 42px; }
  }
`;

export const ExplorationHint = styled.p`
  position: fixed; top: 28px; left: 50%; transform: translateX(-50%); max-width: calc(100vw - 40px);
  width: max-content; z-index: 100; color: #212121; background: #fff; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 10px 16px;
  font-size: 13px; font-weight: 800; text-align: center; pointer-events: none;
`;
