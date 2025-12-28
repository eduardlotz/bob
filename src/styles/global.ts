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
        cursor: none;
    }

    button {
        outline: none;
        border: none;
        box-shadow: none;
        pointer-events: auto;
/* 
        &:not(:disabled) {
            cursor: pointer;
        } */
    }
`;
