import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

import type { NutritionImage } from "./types";

/** El servidor reduce a 1600 px; enviar más solo gasta datos y puede superar los 5 MB. */
export const MAX_IMAGE_DIMENSION = 1600;
export const JPEG_QUALITY = 0.85;

/** Calcula el tamaño destino manteniendo la proporción, o `null` si no hace falta reducir. */
export function targetSize(
  width: number,
  height: number,
  max: number = MAX_IMAGE_DIMENSION,
): { width: number } | { height: number } | null {
  if (width <= 0 || height <= 0) return null;
  if (width <= max && height <= max) return null;
  return width >= height ? { width: max } : { height: max };
}

/**
 * Reduce la imagen a un máximo de 1600 px y la recodifica a JPEG.
 * Si algo falla, devuelve la imagen original para no bloquear el análisis.
 */
export async function prepareImage(
  image: NutritionImage,
): Promise<NutritionImage> {
  try {
    const source = ImageManipulator.manipulate(image.uri);
    const original = await source.renderAsync();
    const size = targetSize(original.width, original.height);

    const rendered = size
      ? await ImageManipulator.manipulate(original).resize(size).renderAsync()
      : original;

    const saved = await rendered.saveAsync({
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });

    return {
      uri: saved.uri,
      width: saved.width,
      height: saved.height,
      fileName: "food.jpg",
      mimeType: "image/jpeg",
    };
  } catch {
    return image;
  }
}

/**
 * Copia la foto al directorio de documentos para que sobreviva a la limpieza
 * de caché del sistema. En web devuelve la URI tal cual.
 */
export async function persistImage(
  uri: string,
  id: string,
): Promise<string | null> {
  if (Platform.OS === "web") return uri;
  try {
    const directory = new Directory(Paths.document, "analyses");
    if (!directory.exists) directory.create({ intermediates: true });
    const destination = new File(directory, `${id}.jpg`);
    await new File(uri).copy(destination, { overwrite: true });
    return destination.uri;
  } catch {
    return uri;
  }
}

/** Borra la foto persistida de un análisis. Ignora errores. */
export function removePersistedImage(uri: string | null): void {
  if (!uri || Platform.OS === "web") return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // La foto ya no existe o no es nuestra; no bloqueamos el borrado.
  }
}
