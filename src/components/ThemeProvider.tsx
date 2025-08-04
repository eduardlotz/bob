import React, { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle<{ theme: any }>`
  :root {
    --primary-color: ${(props) => props.theme?.colors?.primary || "#2979FF"};
    --secondary-color: ${(props) =>
      props.theme?.colors?.secondary || "#4285F4"};
    --accent-color: ${(props) => props.theme?.colors?.accent || "#FFD700"};
    --background-color: ${(props) =>
      props.theme?.colors?.background || "#ffffff"};
    --text-color: ${(props) => props.theme?.colors?.text || "#000000"};
    --font-family: ${(props) => props.theme?.font || "OpenSauceTwo-Regular"};
    
    /* Additional theme variables for better control */
    --border-color: ${(props) => props.theme?.colors?.border || "#e9ecef"};
    --card-background: ${(props) =>
      props.theme?.colors?.cardBackground || "#f8f9fa"};
    --success-color: ${(props) => props.theme?.colors?.success || "#4CAF50"};
    --danger-color: ${(props) => props.theme?.colors?.danger || "#dc3545"};
    --warning-color: ${(props) => props.theme?.colors?.warning || "#ffc107"};
  }

  * {
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  }

  body {
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Apply theme colors to common elements */
  button {
    background-color: var(--primary-color);
    color: white;
  }

  button:hover {
    background-color: var(--secondary-color);
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
      console.log("Applying theme:", currentTheme.name, currentTheme.colors);

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
      root.style.setProperty("--font-family", currentTheme.font);

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
      document.body.style.fontFamily = currentTheme.font;
    }
  }, [currentTheme]);

  return (
    <>
      <GlobalStyle theme={currentTheme} />
      {children}
    </>
  );
}
