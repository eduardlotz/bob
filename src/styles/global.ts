import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

export const GlobalStyle = createGlobalStyle`
    ${reset}

    html {
        box-sizing: border-box;
        background-color: #000000;
    }

    body, root {
        background-color: #000000;
    }

    *,
    *:before,
    *:after {
        box-sizing: inherit;
    }

    button {
        outline: none;
        border: none;
        box-shadow: none;
    }
    
    * {
        font-family: "Plus Jakarta Sans", "Helvetica", sans-serif !important;
    }

`;
