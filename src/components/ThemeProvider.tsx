import React, { useEffect, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { createGlobalStyle } from "styled-components";

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

// TODO: refactor to an actual design system
const GlobalStyle = createGlobalStyle<{ theme: StyledTheme | undefined }>`
  :root {
    // TODO: check if global style with override is really needed 🤨
    /* --primary-color: ${(props) =>
      props.theme?.colors?.basic?.black || "#212121"};
    --secondary-color: ${(props) =>
      props.theme?.colors?.brand?.blue || "#4277F7"};
    --accent-color: ${(props) =>
      props.theme?.colors?.brand?.yellow || "#FFD700"};
    --background-color: ${(props) =>
      props.theme?.colors?.basic?.black || "#212121"};
    --text-color: ${(props) =>
      props.theme?.colors?.basic?.white || "#ffffff"}; */
    --font-family: "Open Sauce Two";
      
    --blob-color: ${(props) => props.theme?.colors?.basic?.black || "#212121"};

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
  const { currentTheme, themes, previewMode } = useGameStore();

  const activeTheme =
    previewMode === "theme" ? themes.find((t) => t.preview) : currentTheme;

  useEffect(() => {
    if (activeTheme) {
      const root = document.documentElement;
      root.style.setProperty("--primary-color", activeTheme.colors.primary);
      root.style.setProperty("--secondary-color", activeTheme.colors.secondary);
      root.style.setProperty("--accent-color", activeTheme.colors.accent);
      root.style.setProperty(
        "--background-color",
        activeTheme.colors.background
      );
      root.style.setProperty("--text-color", activeTheme.colors.text);
      root.style.setProperty("--blob-color", activeTheme.blobColor);
      root.style.setProperty("--outline-color", activeTheme.outlineColor);
      // root.style.setProperty("--font-family", activeTheme.font);

      root.style.setProperty(
        "--border-color",
        activeTheme.colors.border || "#e9ecef"
      );
      root.style.setProperty(
        "--card-background",
        activeTheme.colors.cardBackground || "#f8f9fa"
      );
      root.style.setProperty(
        "--success-color",
        activeTheme.colors.success || "#4CAF50"
      );
      root.style.setProperty(
        "--danger-color",
        activeTheme.colors.danger || "#dc3545"
      );
      root.style.setProperty(
        "--warning-color",
        activeTheme.colors.warning || "#ffc107"
      );

      document.body.style.backgroundColor = activeTheme.colors.background;
      document.body.style.color = activeTheme.colors.text;
      // document.body.style.fontFamily = activeTheme.font;
    }
  }, [activeTheme]);

  return (
    <>
      <GlobalStyle theme={undefined} />
      {children}
    </>
  );
}
