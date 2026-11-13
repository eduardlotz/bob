import styled, { css } from "styled-components";

// Scene labels and cursor labels share the upgrade label's dark chip treatment.
export const sceneChipStyle = css`
  background: #212121;
  color: #fff;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.3rem 0.55rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
`;

export const SceneChip = styled.button`
  ${sceneChipStyle}
  position: relative;
  pointer-events: auto;
  text-decoration: none;
  box-shadow: 0 3px 9px #0002;
  background: #fff;
  color: #212121;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-weight: 700;
  &:hover { background: #f5f5f6; }
  &:focus-visible { outline: 2px solid #4178f7; outline-offset: 4px; }
`;
