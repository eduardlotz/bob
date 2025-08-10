import React, { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { createGlobalStyle } from "styled-components";

// Type mapping to convert game store Theme to styled-components DefaultTheme
type StyledTheme = {
  colors: {
    basic: {
      white: string;
      black: string;
      red: string;
      green: string;
    };
    brand: {
      blue: string;
      yellow: string;
      electricBlue: string;
      electricBlueTrans: string;
    };
    shades: {
      grey: {
        one: string;
        two: string;
        three: string;
        four: string;
        five: string;
        six: string;
        seven: string;
      };
    };
  };
  borders: {
    button: {
      default: string;
      focus: string;
    };
    input: {
      default: string;
      focus: string;
    };
  };
  shadows: {
    none: string;
    subtle: string;
    subtleHover: string;
    blue: string;
    defaultBorderGrey: string;
    selectedBorderGrey: string;
    selectedBorderDarkGrey: string;
    selectedBorderBlue: string;
    selectedBorderRed: string;
    activeBorderBlue: string;
  };
};

const GlobalStyle = createGlobalStyle<{ theme: StyledTheme | undefined }>`
  :root {
    --primary-color: ${(props) =>
      props.theme?.colors?.basic?.white || "#2979FF"};
    --secondary-color: ${(props) =>
      props.theme?.colors?.brand?.blue || "#4285F4"};
    --accent-color: ${(props) =>
      props.theme?.colors?.brand?.yellow || "#FFD700"};
    --background-color: ${(props) =>
      props.theme?.colors?.basic?.black || "#ffffff"};
    --text-color: ${(props) => props.theme?.colors?.basic?.white || "#000000"};
    --font-family: "Open Sauce Two";
    
    /* Additional theme variables for better control */
    --border-color: ${(props) =>
      props.theme?.colors?.shades?.grey?.two || "#e9ecef"};
    --card-background: ${(props) =>
      props.theme?.colors?.shades?.grey?.one || "#f8f9fa"};
    --success-color: ${(props) =>
      props.theme?.colors?.basic?.green || "#4CAF50"};
    --danger-color: ${(props) => props.theme?.colors?.basic?.red || "#dc3545"};
    --warning-color: ${(props) =>
      props.theme?.colors?.brand?.yellow || "#ffc107"};
  }

  * {
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  }

  body {
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--font-family), Aria, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  a, button {
    &:focus {
      outline-color: var(--text-color);
      outline-width: 2px;
      outline-style: solid;
      outline-offset: 3px;
    }
  }

  a {
    color: var(--primary-color);
  }

  a:hover {
    color: var(--secondary-color);
  }

  /* Apply theme to specific game elements */
  .game-ui {
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--font-family);
  }

  .game-button {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  .game-button:hover {
    background-color: var(--secondary-color);
  }

  .accent-text {
    color: var(--accent-color);
  }

  .primary-text {
    color: var(--primary-color);
  }

  .success-text {
    color: var(--success-color);
  }

  .danger-text {
    color: var(--danger-color);
  }

  .warning-text {
    color: var(--warning-color);
  }
`;

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme } = useGameStore();

  useEffect(() => {
    // Apply theme to document root
    if (currentTheme) {
      console.log("Applying theme:", currentTheme.id);

      // Set CSS custom properties
      const root = document.documentElement;
      root.style.setProperty("--primary-color", currentTheme.colors.primary);
      root.style.setProperty(
        "--secondary-color",
        currentTheme.colors.secondary
      );
      root.style.setProperty("--accent-color", currentTheme.colors.accent);
      root.style.setProperty(
        "--background-color",
        currentTheme.colors.background
      );
      root.style.setProperty("--text-color", currentTheme.colors.text);
      // root.style.setProperty("--font-family", currentTheme.font);

      // Set additional theme variables
      root.style.setProperty(
        "--border-color",
        currentTheme.colors.border || "#e9ecef"
      );
      root.style.setProperty(
        "--card-background",
        currentTheme.colors.cardBackground || "#f8f9fa"
      );
      root.style.setProperty(
        "--success-color",
        currentTheme.colors.success || "#4CAF50"
      );
      root.style.setProperty(
        "--danger-color",
        currentTheme.colors.danger || "#dc3545"
      );
      root.style.setProperty(
        "--warning-color",
        currentTheme.colors.warning || "#ffc107"
      );

      // Also apply to body for immediate effect
      document.body.style.backgroundColor = currentTheme.colors.background;
      document.body.style.color = currentTheme.colors.text;
      // document.body.style.fontFamily = currentTheme.font;
    }
  }, [currentTheme]);

  return (
    <>
      <GlobalStyle theme={undefined} />
      {children}
    </>
  );
}
