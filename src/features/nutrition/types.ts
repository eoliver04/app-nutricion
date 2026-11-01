/** Alimento calculado por el servidor (`POST /food-analysis`). */
export type NutritionFood = {
  name: string;
  /** Descripción del alimento en la USDA, o `null` si no hubo coincidencia. */
  usdaMatch: string | null;
  fdcId: number | null;
  grams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  /** Confianza del reconocimiento (0-1). Solo si el servidor la envía. */
  confidence?: number;
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

/** Imagen seleccionada o capturada, lista para subir. */
export type NutritionImage = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string | null;
  mimeType?: string | null;
};

/** Análisis guardado en el dispositivo. */
export type SavedAnalysis = {
  id: string;
  /** Fecha ISO 8601 del análisis. */
  createdAt: string;
  /** URI local de la foto, o `null` si no se pudo conservar. */
  imageUri: string | null;
  analysis: NutritionAnalysis;
};
