export type Macro = {
  label: string;
  value: string;
  progress: number;
  color: string;
};

export type DetectedFood = {
  name: string;
  weight: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
};

export type NutritionFood = {
  name: string;
  usdaMatch: string;
  fdcId: number;
  grams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

export type NutritionAnalysis = {
  foods: NutritionFood[];
  totals: NutritionTotals;
};

export type NutritionImage = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string | null;
  mimeType?: string | null;
};
