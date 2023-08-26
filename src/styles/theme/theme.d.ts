import "styled-components";

// default theme needs to be extended in order to autocomplete custom themes
declare module "styled-components" {
  export interface DefaultTheme {
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
      //TODO: new names 🫡
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
  }
}
