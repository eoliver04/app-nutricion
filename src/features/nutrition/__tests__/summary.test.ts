import {
  analysesForDay,
  averageConfidence,
  confidenceLabel,
  formatDayLabel,
  formatRelativeTime,
  greetingForHour,
  mealLabelForHour,
  percentOf,
  sumTotals,
} from "../summary";
import type { SavedAnalysis } from "../types";

const saved = (createdAt: string, calories: number): SavedAnalysis => ({
  id: createdAt,
  createdAt,
  imageUri: null,
  analysis: {
    foods: [],
    totals: { calories, protein: 10.25, carbohydrates: 20.5, fat: 5.05 },
  },
});

describe("summary helpers", () => {
  it("filtra los análisis de un día concreto", () => {
    const list = [
      saved("2026-11-01T08:00:00.000Z", 300),
      saved("2026-10-31T22:00:00.000Z", 500),
    ];
    const day = new Date("2026-11-01T12:00:00.000Z");
    const result = analysesForDay(list, day);
    expect(result.map((item) => item.analysis.totals.calories)).toEqual([300]);
  });

  it("suma totales redondeando", () => {
    const totals = sumTotals([
      saved("2026-11-01T08:00:00.000Z", 300.4),
      saved("2026-11-01T13:00:00.000Z", 200.4),
    ]);
    expect(totals).toEqual({
      calories: 501,
      protein: 20.5,
      carbohydrates: 41,
      fat: 10.1,
    });
  });

  it("calcula porcentajes acotados", () => {
    expect(percentOf(500, 2000)).toBe(25);
    expect(percentOf(5000, 2000)).toBe(100);
    expect(percentOf(100, 0)).toBe(0);
  });

  it("formatea el día en español", () => {
    expect(formatDayLabel(new Date(2026, 9, 14))).toBe("MIÉRCOLES, 14 OCTUBRE");
  });

  it("formatea tiempos relativos", () => {
    const now = new Date(2026, 10, 1, 13, 0);
    expect(formatRelativeTime(new Date(2026, 10, 1, 12, 48), now)).toBe(
      "hace 12 min",
    );
    expect(formatRelativeTime(new Date(2026, 10, 1, 10, 0), now)).toBe(
      "hace 3 h",
    );
    expect(formatRelativeTime(new Date(2026, 9, 31, 22, 0), now)).toBe("ayer");
    expect(formatRelativeTime(new Date(2026, 9, 20, 9, 5), now)).toBe(
      "20 oct, 09:05",
    );
  });

  it("elige saludo y comida según la hora", () => {
    expect(greetingForHour(9)).toBe("Buenos días");
    expect(greetingForHour(17)).toBe("Buenas tardes");
    expect(greetingForHour(23)).toBe("Buenas noches");
    expect(mealLabelForHour(8)).toBe("Desayuno");
    expect(mealLabelForHour(14)).toBe("Almuerzo");
    expect(mealLabelForHour(21)).toBe("Cena");
  });

  it("resume la confianza solo cuando el servidor la envía", () => {
    expect(averageConfidence([{}, {}])).toBeNull();
    expect(averageConfidence([{ confidence: 0.9 }, { confidence: 0.7 }])).toBeCloseTo(0.8);
    expect(confidenceLabel(null)).toBeNull();
    expect(confidenceLabel(0.8)).toBe("confianza alta");
    expect(confidenceLabel(0.6)).toBe("confianza media");
    expect(confidenceLabel(0.2)).toBe("confianza baja");
  });
});
