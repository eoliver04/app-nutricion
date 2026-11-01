import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnalysisOverview } from "@/components/nutrition/AnalysisOverview";
import { FoodAnalysisList } from "@/components/nutrition/FoodAnalysisList";
import { BottomTabInset, Colors, MaxContentWidth } from "@/constants/theme";
import { analyzeFood } from "@/features/nutrition/api";
import {
  pickFoodPhoto,
  takeFoodPhoto,
} from "@/features/nutrition/image-picker";
import type { NutritionAnalysis, NutritionImage } from "@/features/nutrition/types";

export default function AnalysisScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri?: string;
    imageName?: string;
    imageType?: string;
  }>();

  const uri = Array.isArray(params.imageUri) ? params.imageUri[0] : params.imageUri;
  const fileName = Array.isArray(params.imageName) ? params.imageName[0] : params.imageName;
  const mimeType = Array.isArray(params.imageType) ? params.imageType[0] : params.imageType;

  const [activeImageUri, setActiveImageUri] = useState<string | undefined>(uri);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(uri));

  const handleAnalyze = async (image: NutritionImage) => {
    setActiveImageUri(image.uri);
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeFood(image);
      setAnalysis(result);
    } catch (error: unknown) {
      Alert.alert(
        "No se pudo analizar el plato",
        error instanceof Error
          ? error.message
          : "Inténtalo de nuevo en unos segundos.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!uri) return;
    let isMounted = true;

    analyzeFood({ uri, fileName, mimeType })
      .then((result) => {
        if (isMounted) setAnalysis(result);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          Alert.alert(
            "No se pudo analizar el plato",
            error instanceof Error
              ? error.message
              : "Inténtalo de nuevo en unos segundos.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileName, mimeType, uri]);

  const handleCamera = async () => {
    try {
      const img = await takeFoodPhoto();
      if (img) handleAnalyze(img);
    } catch {
      Alert.alert("Error", "No se pudo acceder a la cámara.");
    }
  };

  const handleGallery = async () => {
    try {
      const img = await pickFoodPhoto();
      if (img) handleAnalyze(img);
    } catch {
      Alert.alert("Error", "No se pudo acceder a la galería.");
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const totals = analysis?.totals;
  const hasAnalysis = Boolean(analysis && analysis.foods.length > 0);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + BottomTabInset + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={handleBack}
            style={styles.back}
            accessibilityLabel="Volver"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Análisis del plato
          </Text>
          <View style={styles.spacer} />
        </View>

        {isLoading ? (
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <ActivityIndicator size="large" color="#1A9B6B" />
            <Text style={[styles.loadingTitle, { color: colors.text }]}>
              Analizando tu plato con IA...
            </Text>
            <Text
              style={[styles.loadingSubtitle, { color: colors.textSecondary }]}
            >
              Identificando alimentos, porciones y valor nutricional
            </Text>
          </View>
        ) : null}

        {!isLoading && !activeImageUri && !hasAnalysis ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🥗</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aún no has analizado ningún plato
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Captura una foto de tu comida o selecciona una imagen de la
              galería para obtener un desglose nutricional completo al instante.
            </Text>
            <View style={styles.emptyActionsRow}>
              <Pressable
                onPress={handleCamera}
                style={({ pressed }) => [
                  styles.ctaButtonPrimary,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.ctaButtonPrimaryText}>📷 Hacer foto</Text>
              </Pressable>
              <Pressable
                onPress={handleGallery}
                style={({ pressed }) => [
                  styles.ctaButtonSecondary,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.ctaButtonSecondaryText}>
                  🖼 Galería
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {activeImageUri || hasAnalysis ? (
          <>
            <AnalysisOverview
              colors={colors}
              imageUri={activeImageUri}
              analysis={analysis ?? undefined}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Resumen nutricional
            </Text>
            <View
              style={[
                styles.nutritionCard,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <NutritionStat
                label="Proteínas"
                value={`${Math.round(totals?.protein ?? 0)}g`}
                color="#36C98F"
              />
              <NutritionStat
                label="Carbohidratos"
                value={`${Math.round(totals?.carbohydrates ?? 0)}g`}
                color="#F5B94C"
              />
              <NutritionStat
                label="Grasas"
                value={`${Math.round(totals?.fat ?? 0)}g`}
                color="#F27D6B"
              />
            </View>

            <View style={styles.foodHeading}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Alimentos detectados
              </Text>
              <Text style={styles.count}>
                {analysis?.foods.length ?? 0} elementos
              </Text>
            </View>
            <FoodAnalysisList colors={colors} foods={analysis?.foods ?? []} />

            {hasAnalysis ? (
              <View style={styles.insight}>
                <Text style={styles.insightIcon}>!</Text>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTitle}>Recomendación del plato</Text>
                  <Text style={styles.insightText}>
                    {totals && totals.protein > 20
                      ? "Excelente aporte de proteína para la recuperación muscular y saciedad."
                      : "Plato ligero. Considera añadir una fuente de proteína para equilibrar los macronutrientes."}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function NutritionStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8F4",
  },
  backText: { color: "#17211D", fontSize: 30, lineHeight: 30 },
  spacer: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  loadingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 32 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  emptyActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  ctaButtonPrimary: {
    flex: 1,
    backgroundColor: "#1A9B6B",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  ctaButtonSecondary: {
    flex: 1,
    backgroundColor: "#E2F2EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonSecondaryText: {
    color: "#176547",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14 },
  nutritionCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    marginBottom: 28,
  },
  stat: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "rgba(120, 140, 130, 0.16)",
    paddingLeft: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginBottom: 9 },
  statLabel: { color: "#81908A", fontSize: 10, lineHeight: 14 },
  statValue: {
    color: "#17211D",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },
  foodHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: {
    color: "#1A9B6B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 14,
  },
  insight: {
    backgroundColor: "#FFF5D8",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    marginTop: 20,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFE8A2",
    color: "#A66A00",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    paddingTop: 6,
  },
  insightCopy: { flex: 1, marginLeft: 12 },
  insightTitle: { color: "#6E4B00", fontSize: 13, fontWeight: "800" },
  insightText: { color: "#856A2C", fontSize: 11, lineHeight: 16, marginTop: 4 },
  pressed: { opacity: 0.8 },
});
