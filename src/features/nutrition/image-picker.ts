import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

import type { NutritionImage } from "./types";

function showPermissionAlert(message: string) {
  Alert.alert("Permiso necesario", message);
}

function getImage(
  result: ImagePicker.ImagePickerResult,
): NutritionImage | null {
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
  };
}

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

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.9,
  });

  return getImage(result);
}

export async function pickFoodPhoto(): Promise<NutritionImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && Platform.OS !== "web") {
    showPermissionAlert(
      "Activa el acceso a tus fotos en los ajustes para seleccionar un plato.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.9,
  });

  return getImage(result);
}
