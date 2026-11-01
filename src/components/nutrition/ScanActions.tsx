import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
    pickFoodPhoto,
    takeFoodPhoto,
} from "@/features/nutrition/image-picker";
import type { NutritionImage } from "@/features/nutrition/types";

export function ScanActions() {
  const goToAnalysis = (image: NutritionImage) => {
    router.push({
      pathname: "/explore",
      params: {
        imageUri: image.uri,
        imageName: image.fileName ?? undefined,
        imageType: image.mimeType ?? undefined,
      },
    });
  };

  const handleCamera = async () => {
    try {
      const image = await takeFoodPhoto();
      if (image) goToAnalysis(image);
    } catch {
      Alert.alert(
        "No se pudo abrir la cámara",
        "Inténtalo de nuevo en unos segundos.",
      );
    }
  };

  const handleGallery = async () => {
    try {
      const image = await pickFoodPhoto();
      if (image) goToAnalysis(image);
    } catch {
      Alert.alert(
        "No se pudo abrir la galería",
        "Comprueba los permisos e inténtalo de nuevo.",
      );
    }
  };

  return (
    <View>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Analiza tu plato</Text>
          <Text style={styles.subtitle}>
            Obtén información nutricional al instante
          </Text>
        </View>
        <Text style={styles.sparkles}>✦</Text>
      </View>
      <Pressable
        onPress={handleCamera}
        style={({ pressed }) => [styles.scanCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.scanIcon}>
          <Text style={styles.scanIconText}>⌾</Text>
        </View>
        <View style={styles.scanCopy}>
          <Text style={styles.scanTitle}>Analizar Plato con IA</Text>
          <Text style={styles.scanDescription}>
            Apunta, captura y conoce lo que hay en tu plato
          </Text>
        </View>
        <Text style={styles.arrow}>↗</Text>
      </Pressable>
      <View style={styles.actionsRow}>
        <ActionButton icon="⌾" label="Hacer foto" onPress={handleCamera} />
        <ActionButton
          icon="▧"
          label="Subir desde galería"
          onPress={handleGallery}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
    >
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { color: "#17211D", fontSize: 19, fontWeight: "800" },
  subtitle: { color: "#81908A", fontSize: 12, marginTop: 4 },
  sparkles: { color: "#1A9B6B", fontSize: 26 },
  scanCard: {
    backgroundColor: "#1A9B6B",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#1A9B6B",
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanIconText: { color: "#FFFFFF", fontSize: 28 },
  scanCopy: { flex: 1, marginHorizontal: 14 },
  scanTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  scanDescription: {
    color: "#D6F5E8",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  arrow: { color: "#FFFFFF", fontSize: 22 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  actionButton: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: "#F0F8F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 9,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: { color: "#1A9B6B", fontSize: 20 },
  actionLabel: {
    flex: 1,
    color: "#176547",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  pressed: { opacity: 0.78 },
});
