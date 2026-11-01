import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

import { prepareImage } from "./prepare-image";
import type { NutritionImage } from "./types";

function showPermissionAlert(message: string) {
  Alert.alert("Permiso necesario", message);
}

async function toNutritionImage(
  result: ImagePicker.ImagePickerResult,
): Promise<NutritionImage | null> {
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return prepareImage({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
  });
}

// Sin recorte forzado: un encuadre 4:3 puede dejar comida fuera de la foto.
const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: false,
  quality: 1,
  exif: false,
};

export async function takeFoodPhoto(): Promise<NutritionImage | null> {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert(
        "Activa el acceso a la cámara en los ajustes para fotografiar tu plato.",
      );
      return null;
    }
  }

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  return toNutritionImage(result);
}

export async function pickFoodPhoto(): Promise<NutritionImage | null> {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert(
        "Activa el acceso a tus fotos en los ajustes para seleccionar un plato.",
      );
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  return toNutritionImage(result);
}
