import { css } from "styled-components";

export const chatBubbleStyles = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  padding: 15px 20px;
  background: var(--chat-color);
  color: var(--text-color);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(33, 33, 33, 0.1);
  width: fit-content;
  min-width: 90px;
  max-width: 100%;
`;

export const chatTextStyles = css`
  line-height: 1.4;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-color);
  white-space: pre-wrap;
`;
