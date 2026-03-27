import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

export const GlobalStyle = createGlobalStyle`
    ${reset}

    @font-face {
        font-family: "Open Sauce Two";
        src: url("/fonts/OpenSauceTwo-Regular.woff2") format("woff2");
        font-weight: 400;
        font-style: normal;
    }
    
    @font-face {
        font-family: "Open Sauce Two";
        src: url("/fonts/OpenSauceTwo-Medium.woff2") format("woff2");
        font-weight: 500;
        font-style: normal;
    }
    
    @font-face {
        font-family: "Open Sauce Two";
        src: url("/fonts/OpenSauceTwo-SemiBold.woff2") format("woff2");
        font-weight: 600;
        font-style: normal;
    }
    
    @font-face {
        font-family: "Open Sauce Two";
        src: url("/fonts/OpenSauceTwo-Bold.woff2") format("woff2");
        font-weight: 700;
        font-style: normal;
    }
    
    @font-face {
        font-family: "Open Sauce Two";
        src: url("/fonts/OpenSauceTwo-Black.woff2") format("woff2");
        font-weight: 800;
        font-style: normal;
    }

    html {
        box-sizing: border-box;
        background-color: #000000;
    }

    body, root {
        background-color: #000000;
    }
    
    body, root, button, input, textarea, select, p, a {
        font-family: "Open Sauce Two", Helvetica, Arial, sans-serif;
        user-select: none;
        -webkit-user-select: none;
    }

    *,
    *:before,
    *:after {
        box-sizing: inherit;
        cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=), auto !important;
    }

    button {
        outline: none;
        border: none;
        box-shadow: none;
        pointer-events: auto;
    }

    [data-sileo-viewport] {
        z-index: 9999;
    }
    
    .toast-title {
      /* color: radial-gradient(#98308A,#F286ED); */
      /* color: radial-gradient(circle at 50% 50%, #98308A 0%, #F286ED 70%); */
      color: #5e425b;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .toast-desc {
      color: #cbb3d0;
      font-weight: 500;
      font-size: 0.75rem;
      text-align: inherit;
    }

    .sileo-top-lights {
      --vorgarten-toast-duration: 6000ms;
      position: fixed;
      left: 50%;
      top: 0;
      width: min(54rem, calc(100vw + 10rem));
      height: 36rem;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transition: opacity calc(var(--sileo-duration, 680ms) * 0.66) ease;
    }

    body:has([data-sileo-viewport][data-position="top-center"]) .sileo-top-lights {
      opacity: 1;
    }

    .sileo-top-light {
      position: absolute;
      top: -2.85rem;
      left: 50%;
      width: var(--beam-width, 5rem);
      height: 31.5rem;
      border-radius: 999px;
      pointer-events: none;
      transform-origin: 50% 0%;
      background: linear-gradient(
        180deg,
        var(--beam-color, rgba(210, 144, 236, 0.68)) 0%,
        rgba(255, 255, 255, 0) 83%
      );
      filter: blur(56px) saturate(132%);
      opacity: 0.52;
      transform:
        translateX(calc(-50% + var(--beam-offset, 0px)))
        rotate(var(--beam-angle, 0deg))
        scale(0.98);
      animation:
        sileo-toast-light-drift calc(var(--vorgarten-toast-duration) * 1.08) ease-in-out infinite alternate,
        sileo-toast-light-breathe calc(var(--vorgarten-toast-duration) * 0.82) ease-in-out infinite;
      animation-delay: var(--beam-delay, 0ms);
    }

    .sileo-top-light--left-45 {
      --beam-angle: -45deg;
      --beam-offset: -32px;
      --beam-width: 5.7rem;
      --beam-color: rgba(134, 183, 255, 0.62);
      --beam-drift: -10px;
      --beam-wobble: -2.5deg;
      --beam-delay: 140ms;
    }

    .sileo-top-light--left-25 {
      --beam-angle: -25deg;
      --beam-offset: -17px;
      --beam-width: 5.1rem;
      --beam-color: rgba(122, 224, 255, 0.58);
      --beam-drift: -8px;
      --beam-wobble: -1.5deg;
      --beam-delay: 220ms;
    }

    .sileo-top-light--vertical {
      --beam-angle: 0deg;
      --beam-offset: 0px;
      --beam-width: 5rem;
      --beam-color: rgba(182, 255, 214, 0.6);
      --beam-drift: 0px;
      --beam-wobble: 0.6deg;
      --beam-delay: 0ms;
    }

    .sileo-top-light--right-25 {
      --beam-angle: 25deg;
      --beam-offset: 17px;
      --beam-width: 5.1rem;
      --beam-color: rgba(247, 172, 255, 0.58);
      --beam-drift: 8px;
      --beam-wobble: 1.5deg;
      --beam-delay: 260ms;
    }

    .sileo-top-light--right-45 {
      --beam-angle: 45deg;
      --beam-offset: 32px;
      --beam-width: 5.7rem;
      --beam-color: rgba(222, 142, 255, 0.6);
      --beam-drift: 10px;
      --beam-wobble: 2.4deg;
      --beam-delay: 80ms;
    }

    @keyframes sileo-toast-light-drift {
      from {
        transform:
          translateX(calc(-50% + var(--beam-offset, 0px)))
          rotate(var(--beam-angle, 0deg))
          scale(0.94, 0.98);
      }

      to {
        transform:
          translateX(calc(-50% + var(--beam-offset, 0px) + var(--beam-drift, 0px)))
          rotate(calc(var(--beam-angle, 0deg) + var(--beam-wobble, 0deg)))
          scale(1.04, 1.08);
      }
    }

    @keyframes sileo-toast-light-breathe {
      0%,
      100% {
        opacity: 0.36;
      }

      40% {
        opacity: 0.62;
      }

      70% {
        opacity: 0.48;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sileo-top-lights {
        transition: none;
      }

      .sileo-top-light {
        animation: none;
      }
    }
`;
