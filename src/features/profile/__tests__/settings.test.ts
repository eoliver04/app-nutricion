import { DEFAULT_SETTINGS, normalizeSettings } from "../settings";

describe("normalizeSettings", () => {
  it("devuelve los valores por defecto ante datos inválidos", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ dailyCalorieGoal: -5, name: 42 })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it("recorta el nombre y redondea los objetivos", () => {
    const result = normalizeSettings({
      name: "  Ana  ",
      dailyCalorieGoal: 1800.6,
      proteinGoal: 120,
      carbsGoal: 200,
      fatGoal: 60,
    });
    expect(result).toEqual({
      name: "Ana",
      dailyCalorieGoal: 1801,
      proteinGoal: 120,
      carbsGoal: 200,
      fatGoal: 60,
    });
  });
});
