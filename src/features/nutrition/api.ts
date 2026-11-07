import { File } from "expo-file-system";
import { Platform } from "react-native";

import type {
  NutritionAnalysis,
  NutritionFood,
  NutritionImage,
  NutritionTotals,
} from "./types";

/** Gemini + USDA pueden tardar; damos margen antes de abortar. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/** Traza en la consola de Metro, con prefijo para localizarla rápido. */
const log = {
  info: (message: string, ...rest: unknown[]) =>
    console.log(`[NutriAI] ${message}`, ...rest),
  error: (message: string, ...rest: unknown[]) =>
    console.error(`[NutriAI] ${message}`, ...rest),
};

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getBaseUrl(
  baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): string {
  if (!baseUrl || baseUrl.trim() === "") {
    throw new ApiError(
      "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.",
    );
  }
  return baseUrl.trim().replace(/\/+$/, "");
}

export function getAnalysisUrl(
  baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): string {
  return `${getBaseUrl(baseUrl)}/food-analysis`;
}

export type BackendCheck = {
  url: string;
  ok: boolean;
  /** Código HTTP recibido, o `null` si no hubo respuesta. */
  status: number | null;
  /** Milisegundos hasta la respuesta o el fallo. */
  elapsedMs: number;
  /** Mensaje técnico del fallo, si lo hubo. */
  detail: string | null;
};

/**
 * Hace un GET al health check del backend desde el propio dispositivo.
 * Sirve para distinguir un problema de red de un problema en la subida.
 */
export async function checkBackend(
  timeoutMs: number = 10_000,
): Promise<BackendCheck> {
  const url = `${getBaseUrl()}/`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    log.info(`Comprobando conexión: GET ${url}`);
    const response = await fetch(url, { signal: controller.signal });
    const result: BackendCheck = {
      url,
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      detail: response.ok ? null : `HTTP ${response.status}`,
    };
    log.info(`Comprobación: HTTP ${result.status} en ${result.elapsedMs} ms`);
    return result;
  } catch (error: unknown) {
    const detail =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Sin respuesta en ${timeoutMs / 1000} s`
          : `${error.name}: ${error.message}`
        : String(error);
    log.error(`Comprobación fallida (${url}): ${detail}`, error);
    return {
      url,
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      detail,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const toNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

function normalizeFood(raw: unknown): NutritionFood | null {
  if (typeof raw !== "object" || raw === null) return null;
  const food = raw as Record<string, unknown>;
  const name = toNullableString(food.name);
  if (!name) return null;

  const confidence = toNullableNumber(food.confidence);

  return {
    name,
    usdaMatch: toNullableString(food.usdaMatch),
    fdcId: toNullableNumber(food.fdcId),
    grams: toNumber(food.grams),
    calories: toNumber(food.calories),
    protein: toNumber(food.protein),
    carbohydrates: toNumber(food.carbohydrates),
    fat: toNumber(food.fat),
    ...(confidence !== null ? { confidence } : {}),
  };
}

function normalizeTotals(raw: unknown): NutritionTotals {
  const totals =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  return {
    calories: toNumber(totals.calories),
    protein: toNumber(totals.protein),
    carbohydrates: toNumber(totals.carbohydrates),
    fat: toNumber(totals.fat),
  };
}

function extractErrorMessage(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null) {
    const { message, error } = data as Record<string, unknown>;
    if (typeof message === "string" && message.trim() !== "") return message;
    if (Array.isArray(message) && message.length > 0) {
      return message.map(String).join(", ");
    }
    if (typeof error === "string" && error.trim() !== "") return error;
  }
  if (status === 413) return "La imagen es demasiado grande (máximo 5 MB).";
  if (status === 429) {
    return "Has hecho demasiadas peticiones seguidas. Espera un minuto.";
  }
  return `El servidor respondió con error ${status}.`;
}

/**
 * Convierte la respuesta cruda del servidor en un `NutritionAnalysis`
 * validado. Lanza `ApiError` con un mensaje apto para el usuario.
 */
export function parseAnalysisResponse(
  body: string,
  status: number,
): NutritionAnalysis {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    const looksLikeHtml = /<html|<!doctype/i.test(body);
    if (status === 502 || status === 503 || status === 504 || looksLikeHtml) {
      throw new ApiError(
        "El servidor no está disponible en este momento. Inténtalo de nuevo en unos segundos.",
        status,
      );
    }
    throw new ApiError(
      `El servidor respondió con código ${status}, pero no devolvió JSON válido.`,
      status,
    );
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(extractErrorMessage(data, status), status);
  }

  if (typeof data !== "object" || data === null) {
    throw new ApiError("La respuesta del servidor no tiene el formato esperado.");
  }

  const payload = data as Record<string, unknown>;
  const foods = Array.isArray(payload.foods)
    ? payload.foods
        .map(normalizeFood)
        .filter((food): food is NutritionFood => food !== null)
    : [];

  return { foods, totals: normalizeTotals(payload.totals) };
}

async function buildFormData(image: NutritionImage): Promise<FormData> {
  const formData = new FormData();
  const name = image.fileName ?? "food.jpg";

  if (Platform.OS === "web") {
    const response = await fetch(image.uri);
    const blob = await response.blob();
    formData.append("image", blob, name);
    return formData;
  }

  // El fetch de Expo (SDK 54+) no acepta el formato {uri, name, type} de
  // React Native: necesita un Blob real. `File` de expo-file-system lo
  // implementa y lee el fichero local bajo demanda.
  const file = new File(image.uri);
  formData.append("image", file as unknown as Blob, name);
  return formData;
}

export type AnalyzeOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

/** Sube la imagen al backend y devuelve el análisis nutricional. */
export async function analyzeFood(
  image: NutritionImage,
  options: AnalyzeOptions = {},
): Promise<NutritionAnalysis> {
  const url = getAnalysisUrl();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onExternalAbort);

  try {
    log.info(
      `Subiendo imagen: POST ${url} (uri=${image.uri}, type=${image.mimeType ?? "?"}, ${image.width ?? "?"}x${image.height ?? "?"})`,
    );
    const formData = await buildFormData(image);
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    log.info(`Respuesta del servidor: HTTP ${response.status} (${text.length} bytes)`);
    return parseAnalysisResponse(text, response.status);
  } catch (error: unknown) {
    log.error("Fallo al analizar la imagen:", error);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        options.signal?.aborted
          ? "Análisis cancelado."
          : "El análisis ha tardado demasiado. Comprueba tu conexión e inténtalo de nuevo.",
      );
    }
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    throw new ApiError(
      `No se pudo conectar con el servidor (${url}). Comprueba que esté en marcha y que EXPO_PUBLIC_API_URL sea correcta.\n\nDetalle técnico: ${detail}`,
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}
