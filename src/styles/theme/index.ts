//TODO: add text styles, spacing

export const theme = {
  colors: {
    basic: {
      white: "#FFFFFF",
      black: "#130f26",
      red: "#DD2929",
      green: "#77C752",
    },
    brand: {
      blue: "#0822AA",
      yellow: "#F9DD4A",
      electricBlue: "#0E1EF5",
      electricBlueTrans: "#0E1EF508",
    },

    shades: {
      grey: {
        one: "#FAFAFA",
        two: "#EAECF0",
        three: "#919AAC",
        four: "#DDE2E5",
        five: "#DEDDDF",
        six: "#716F7C",
        seven: "#F0F0F5",
      },
    },
  },
  borders: {
    button: {
      default: "1.5px solid #EEEEF3",
      focus: "1.5px solid #0E1EF5",
    },
    input: {
      default: "1.5px solid #EEEEF3",
      focus: "1.5px solid #0E1EF5",
    },
  },
  shadows: {
    none: "0px 0px 0px rgba(0, 0, 0, 0)",
    subtle: "0px 1px 1px rgba(0, 0, 0, 0.02)",
    subtleHover: "0px 3px 6px rgba(0, 0, 0, 0.04);",
    blue: "0px 2px 7px rgba(0, 0, 0, 0.05)",
    defaultBorderGrey: "0px 0px 0px 1px #EEEEF3",
    selectedBorderGrey: "0px 0px 0px 4px #EEEEF3",
    selectedBorderDarkGrey: "0px 0px 0px 4px rgba(72, 75, 77, 0.2)",
    selectedBorderBlue: "0px 0px 0px 4px rgba(14, 30, 245, 0.2)",
    selectedBorderRed: "0px 0px 0px 4px rgba(221, 41, 41, 0.2)",
    activeBorderBlue: "0px 0px 0px 2px rgba(14, 30, 245, 1)",
  },
};
