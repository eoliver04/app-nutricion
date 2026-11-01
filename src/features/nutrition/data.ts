import type { DetectedFood, Macro } from "./types";

export const dailyMacros: Macro[] = [
  { label: "Proteínas", value: "82g", progress: 0.72, color: "#36C98F" },
  { label: "Carbos", value: "126g", progress: 0.58, color: "#F5B94C" },
  { label: "Grasas", value: "38g", progress: 0.44, color: "#F27D6B" },
];

export const detectedFoods: DetectedFood[] = [
  {
    name: "Bistec de ternera",
    weight: "200g",
    kcal: "420",
    protein: "48g",
    carbs: "0g",
    fat: "24g",
  },
  {
    name: "Patatas asadas",
    weight: "160g",
    kcal: "248",
    protein: "5g",
    carbs: "42g",
    fat: "8g",
  },
  {
    name: "Brócoli",
    weight: "90g",
    kcal: "31",
    protein: "3g",
    carbs: "6g",
    fat: "0g",
  },
  {
    name: "Vino tinto",
    weight: "150ml",
    kcal: "125",
    protein: "0g",
    carbs: "4g",
    fat: "0g",
  },
];
