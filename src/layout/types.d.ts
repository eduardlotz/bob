type DynamicDisplayUnit = "d" | "s" | "v" | "l" | "" | "";
type MeasureUnit =
  | "%"
  | "px"
  | "em"
  | "rem"
  | `${DynamicDisplayUnit}h`
  | `${DynamicDisplayUnit}w`;
type NumberWithMeasure = `${number}${MeasureUnit}` | 0 | "0" | "auto";
