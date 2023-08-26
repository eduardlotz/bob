import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

export const GlobalStyle = createGlobalStyle`
    ${reset}

    html {
        box-sizing: border-box;
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
