import { WeatherEffect } from "@/store";

export const initialWeatherEffects: WeatherEffect[] = [
  {
    id: "environment_rain",
    name: "Regen",
    description: "",
    cost: 4_000,

    purchased: false,
    type: "environment",
    enabled: false,
  },
  {
    id: "environment_clouds",
    name: "Wolken/Nebel",
    description: "Noch nicht so ganz fertig",
    cost: 10_000,

    purchased: false,
    type: "environment",
    enabled: false,
  },
  {
    id: "environment_stars",
    name: "Sterne",
    description: "",
    cost: 22_000,

    purchased: false,
    type: "environment",
    enabled: false,
  },
];
