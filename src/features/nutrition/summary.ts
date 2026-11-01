import type { NutritionTotals, SavedAnalysis } from "./types";

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fat: 0,
};

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Análisis realizados el día indicado (por defecto, hoy). */
export function analysesForDay(
  list: SavedAnalysis[],
  day: Date = new Date(),
): SavedAnalysis[] {
  return list.filter((item) => isSameLocalDay(new Date(item.createdAt), day));
}

export function sumTotals(list: SavedAnalysis[]): NutritionTotals {
  const totals = list.reduce(
    (acc, item) => {
      acc.calories += item.analysis.totals.calories;
      acc.protein += item.analysis.totals.protein;
      acc.carbohydrates += item.analysis.totals.carbohydrates;
      acc.fat += item.analysis.totals.fat;
      return acc;
    },
    { ...EMPTY_TOTALS },
  );
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbohydrates: Math.round(totals.carbohydrates * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

/** Porcentaje 0-100 de `value` sobre `goal`, acotado. */
export function percentOf(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

/** "LUNES, 14 OCTUBRE" */
export function formatDayLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}, ${date.getDate()} ${month}`.toUpperCase();
}

/** "14 oct, 13:05" */
export function formatDateTime(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${month}, ${hours}:${minutes}`;
}

/** "hace 12 min", "hace 2 h", "ayer", o la fecha. */
export function formatRelativeTime(
  date: Date,
  now: Date = new Date(),
): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && isSameLocalDay(date, now)) return `hace ${hours} h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(date, yesterday)) return "ayer";
  return formatDateTime(date);
}

export function greetingForHour(hour: number): string {
  if (hour < 6) return "Buenas noches";
  if (hour < 14) return "Buenos días";
  if (hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

export function mealLabelForHour(hour: number): string {
  if (hour < 11) return "Desayuno";
  if (hour < 16) return "Almuerzo";
  if (hour < 20) return "Merienda";
  return "Cena";
}

/** Media de la confianza de los alimentos, o `null` si el servidor no la envía. */
export function averageConfidence(
  foods: { confidence?: number }[],
): number | null {
  const values = foods
    .map((food) => food.confidence)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function confidenceLabel(confidence: number | null): string | null {
  if (confidence === null) return null;
  if (confidence >= 0.75) return "confianza alta";
  if (confidence >= 0.5) return "confianza media";
  return "confianza baja";
}
