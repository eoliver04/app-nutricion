import { File, UploadType } from "expo-file-system";
import { Platform } from "react-native";

import type { NutritionAnalysis, NutritionImage } from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function getAnalysisUrl(): string {
  if (!API_URL) {
    throw new Error(
      "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.",
    );
  }

  return `${API_URL.replace(/\/$/, "")}/food-analysis`;
}

function parseResponseBody(body: string, status: number): NutritionAnalysis {
  let data: any;
  try {
    data = JSON.parse(body);
  } catch {
    if (status === 502 || status === 504 || body.includes("<html") || body.includes("<!DOCTYPE")) {
      throw new Error(
        "El servidor está iniciando o no responde. Si está alojado en Render, espera 30-60 segundos e inténtalo de nuevo.",
      );
    }
    throw new Error(
      `El servidor respondió con código ${status}, pero no devolvió JSON válido.`,
    );
  }

  if (status < 200 || status >= 300) {
    const errorMsg =
      (typeof data?.message === "string" ? data.message : null) ||
      (Array.isArray(data?.message) ? data.message.join(", ") : null) ||
      data?.error ||
      `El servidor respondió con error ${status}.`;
    throw new Error(errorMsg);
  }

  return data as NutritionAnalysis;
}

export async function analyzeFood(
  image: NutritionImage,
): Promise<NutritionAnalysis> {
  const url = getAnalysisUrl();
  console.log("[NutriAI] 📤 Enviando imagen a:", url);

  // Web platform upload using standard FormData + Blob
  if (Platform.OS === "web") {
    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("image", blob, image.fileName ?? "food.jpg");

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      return parseResponseBody(text, res.status);
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("No se pudo conectar con el servidor desde la web.");
    }
  }

  // Native platforms (iOS / Android)
  try {
    const imageFile = new File(image.uri);
    const result = await imageFile.upload(url, {
      httpMethod: "POST",
      uploadType: UploadType.MULTIPART,
      fieldName: "image",
      mimeType: image.mimeType ?? "image/jpeg",
    });

    console.log("[NutriAI] 📥 Respuesta del servidor recibida con código:", result.status);
    return parseResponseBody(result.body, result.status);
  } catch (nativeErr: unknown) {
    if (nativeErr instanceof Error && nativeErr.message.includes("El servidor")) {
      throw nativeErr;
    }

    // Fallback using React Native FormData for local uri formats (e.g., content:// or ph://)
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: image.uri,
        name: image.fileName ?? "food.jpg",
        type: image.mimeType ?? "image/jpeg",
      } as any);

      const res = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const text = await res.text();
      return parseResponseBody(text, res.status);
    } catch {
      throw nativeErr instanceof Error
        ? nativeErr
        : new Error("No se pudo enviar la imagen al servidor.");
    }
  }
}
