import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "nutriai.settings.v1";

export type UserSettings = {
  name: string;
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
};

export const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  dailyCalorieGoal: 2000,
  proteinGoal: 100,
  carbsGoal: 250,
  fatGoal: 65,
};

const positiveOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : fallback;

export function normalizeSettings(raw: unknown): UserSettings {
  const source =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  return {
    name: typeof source.name === "string" ? source.name.trim().slice(0, 40) : "",
    dailyCalorieGoal: positiveOr(
      source.dailyCalorieGoal,
      DEFAULT_SETTINGS.dailyCalorieGoal,
    ),
    proteinGoal: positiveOr(source.proteinGoal, DEFAULT_SETTINGS.proteinGoal),
    carbsGoal: positiveOr(source.carbsGoal, DEFAULT_SETTINGS.carbsGoal),
    fatGoal: positiveOr(source.fatGoal, DEFAULT_SETTINGS.fatGoal),
  };
}

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(
  settings: UserSettings,
): Promise<UserSettings> {
  const normalized = normalizeSettings(settings);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
