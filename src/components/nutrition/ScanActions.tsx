import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  pickFoodPhoto,
  takeFoodPhoto,
} from "@/features/nutrition/image-picker";
import type { NutritionImage } from "@/features/nutrition/types";
import { useAppColors } from "@/hooks/use-app-colors";

export function ScanActions() {
  const colors = useAppColors();
  const [isPreparing, setIsPreparing] = useState(false);

  const goToAnalysis = (image: NutritionImage) => {
    router.push({
      pathname: "/analysis",
      params: {
        imageUri: image.uri,
        imageName: image.fileName ?? undefined,
        imageType: image.mimeType ?? undefined,
        // Cambia en cada petición para que la pantalla de análisis
        // vuelva a analizar aunque la URI se repita.
        requestId: String(Date.now()),
      },
    });
  };

  const run = async (
    pick: () => Promise<NutritionImage | null>,
    errorTitle: string,
    errorMessage: string,
  ) => {
    if (isPreparing) return;
    setIsPreparing(true);
    try {
      const image = await pick();
      if (image) goToAnalysis(image);
    } catch {
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleCamera = () =>
    run(
      takeFoodPhoto,
      "No se pudo abrir la cámara",
      "Inténtalo de nuevo en unos segundos.",
    );

  const handleGallery = () =>
    run(
      pickFoodPhoto,
      "No se pudo abrir la galería",
      "Comprueba los permisos e inténtalo de nuevo.",
    );

  return (
    <View>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Analiza tu plato
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Obtén información nutricional al instante
          </Text>
        </View>
        <Text
          style={[styles.sparkles, { color: colors.primary }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          ✦
        </Text>
      </View>
      <Pressable
        onPress={handleCamera}
        disabled={isPreparing}
        style={({ pressed }) => [
          styles.scanCard,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Analizar plato con IA. Abre la cámara"
        accessibilityState={{ disabled: isPreparing, busy: isPreparing }}
      >
        <View style={styles.scanIcon}>
          {isPreparing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.scanIconText, { color: colors.onPrimary }]}>
              ⌾
            </Text>
          )}
        </View>
        <View style={styles.scanCopy}>
          <Text style={[styles.scanTitle, { color: colors.onPrimary }]}>
            Analizar plato con IA
          </Text>
          <Text
            style={[styles.scanDescription, { color: colors.onPrimaryMuted }]}
          >
            {isPreparing
              ? "Preparando la imagen..."
              : "Apunta, captura y conoce lo que hay en tu plato"}
          </Text>
        </View>
        <Text style={[styles.arrow, { color: colors.onPrimary }]}>↗</Text>
      </Pressable>
      <View style={styles.actionsRow}>
        <ActionButton
          icon="⌾"
          label="Hacer foto"
          onPress={handleCamera}
          disabled={isPreparing}
        />
        <ActionButton
          icon="▧"
          label="Subir desde galería"
          onPress={handleGallery}
          disabled={isPreparing}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: colors.surfaceTint },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.actionIconText, { color: colors.primary }]}>
          {icon}
        </Text>
      </View>
      <Text style={[styles.actionLabel, { color: colors.onPrimarySoft }]}>
        {label}
      </Text>
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
  title: { fontSize: 19, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 4 },
  sparkles: { fontSize: 26 },
  scanCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  scanIconText: { fontSize: 28 },
  scanCopy: { flex: 1, marginHorizontal: 14 },
  scanTitle: { fontSize: 16, fontWeight: "800" },
  scanDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  arrow: { fontSize: 22 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  actionButton: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 9,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: { fontSize: 20 },
  actionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  pressed: { opacity: 0.78 },
});
