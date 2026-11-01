import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearAnalyses,
  deleteAnalysis,
  getAnalysis,
  listAnalyses,
  saveAnalysis,
} from "../storage";
import type { NutritionAnalysis } from "../types";

jest.mock("../prepare-image", () => ({ removePersistedImage: jest.fn() }));

const analysis: NutritionAnalysis = {
  foods: [],
  totals: { calories: 100, protein: 1, carbohydrates: 2, fat: 3 },
};

describe("storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("empieza vacío y guarda del más reciente al más antiguo", async () => {
    expect(await listAnalyses()).toEqual([]);

    await saveAnalysis({
      id: "a",
      analysis,
      imageUri: null,
      createdAt: new Date("2026-11-01T08:00:00.000Z"),
    });
    await saveAnalysis({
      id: "b",
      analysis,
      imageUri: "file:///b.jpg",
      createdAt: new Date("2026-11-01T13:00:00.000Z"),
    });

    const list = await listAnalyses();
    expect(list.map((item) => item.id)).toEqual(["b", "a"]);
    expect(await getAnalysis("b")).toMatchObject({ imageUri: "file:///b.jpg" });
  });

  it("borra un análisis concreto y todo el historial", async () => {
    await saveAnalysis({ id: "a", analysis, imageUri: null });
    await saveAnalysis({ id: "b", analysis, imageUri: null });

    await deleteAnalysis("a");
    expect((await listAnalyses()).map((item) => item.id)).toEqual(["b"]);

    await clearAnalyses();
    expect(await listAnalyses()).toEqual([]);
  });

  it("ignora contenido corrupto en el almacenamiento", async () => {
    await AsyncStorage.setItem("nutriai.analyses.v1", "{not json");
    expect(await listAnalyses()).toEqual([]);

    await AsyncStorage.setItem(
      "nutriai.analyses.v1",
      JSON.stringify([{ id: "x" }, { id: "ok", createdAt: "2026-01-01T00:00:00.000Z", imageUri: null, analysis }]),
    );
    expect((await listAnalyses()).map((item) => item.id)).toEqual(["ok"]);
  });
});
