import AsyncStorage from "@react-native-async-storage/async-storage";

import { removePersistedImage } from "./prepare-image";
import type { NutritionAnalysis, SavedAnalysis } from "./types";

const STORAGE_KEY = "nutriai.analyses.v1";
/** Límite de análisis guardados para no crecer sin control. */
export const MAX_SAVED_ANALYSES = 200;

function isSavedAnalysis(value: unknown): value is SavedAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.analysis === "object" &&
    item.analysis !== null &&
    Array.isArray((item.analysis as Record<string, unknown>).foods)
  );
}

function sortNewestFirst(list: SavedAnalysis[]): SavedAnalysis[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function writeAll(list: SavedAnalysis[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function createAnalysisId(now: number = Date.now()): string {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Lista todos los análisis guardados, del más reciente al más antiguo. */
export async function listAnalyses(): Promise<SavedAnalysis[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortNewestFirst(parsed.filter(isSavedAnalysis));
  } catch {
    return [];
  }
}

export async function getAnalysis(id: string): Promise<SavedAnalysis | null> {
  const list = await listAnalyses();
  return list.find((item) => item.id === id) ?? null;
}

export async function saveAnalysis(input: {
  id?: string;
  analysis: NutritionAnalysis;
  imageUri: string | null;
  createdAt?: Date;
}): Promise<SavedAnalysis> {
  const saved: SavedAnalysis = {
    id: input.id ?? createAnalysisId(),
    createdAt: (input.createdAt ?? new Date()).toISOString(),
    imageUri: input.imageUri,
    analysis: input.analysis,
  };
  const current = await listAnalyses();
  const next = sortNewestFirst([
    saved,
    ...current.filter((item) => item.id !== saved.id),
  ]).slice(0, MAX_SAVED_ANALYSES);
  await writeAll(next);
  return saved;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const current = await listAnalyses();
  const target = current.find((item) => item.id === id);
  if (target) removePersistedImage(target.imageUri);
  await writeAll(current.filter((item) => item.id !== id));
}

export async function clearAnalyses(): Promise<void> {
  const current = await listAnalyses();
  current.forEach((item) => removePersistedImage(item.imageUri));
  await AsyncStorage.removeItem(STORAGE_KEY);
}
