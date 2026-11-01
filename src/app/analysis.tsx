import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnalysisOverview } from "@/components/nutrition/AnalysisOverview";
import { FoodAnalysisList } from "@/components/nutrition/FoodAnalysisList";
import { ScreenHeader } from "@/components/screen-header";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { analyzeFood } from "@/features/nutrition/api";
import {
  pickFoodPhoto,
  takeFoodPhoto,
} from "@/features/nutrition/image-picker";
import { persistImage } from "@/features/nutrition/prepare-image";
import {
  createAnalysisId,
  deleteAnalysis,
  getAnalysis,
  saveAnalysis,
} from "@/features/nutrition/storage";
import type {
  NutritionImage,
  SavedAnalysis,
} from "@/features/nutrition/types";
import { useUserSettings } from "@/features/profile/use-user-settings";
import { useAppColors } from "@/hooks/use-app-colors";

type Params = {
  id?: string;
  imageUri?: string;
  imageName?: string;
  imageType?: string;
  requestId?: string;
};

type NavJob =
  | { kind: "open"; requestId: string; id: string }
  | { kind: "analyze"; requestId: string; image: NutritionImage };

type ScreenState = {
  current: SavedAnalysis | null;
  previewUri: string | null;
  busy: boolean;
};

const IDLE: ScreenState = { current: null, previewUri: null, busy: false };

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Peticiones ya atendidas en esta sesión. Vive fuera del componente para que
 * un remontaje de la pestaña no vuelva a analizar (y guardar) la misma foto.
 */
const handledRequests = new Set<string>();

function showAnalysisError(error: unknown) {
  Alert.alert(
    "No se pudo analizar el plato",
    error instanceof Error ? error.message : "Inténtalo de nuevo en unos segundos.",
  );
}

async function analyzeAndSave(
  image: NutritionImage,
  signal: AbortSignal,
): Promise<SavedAnalysis> {
  const analysis = await analyzeFood(image, { signal });
  const id = createAnalysisId();
  const storedUri = await persistImage(image.uri, id);
  return saveAnalysis({ id, analysis, imageUri: storedUri });
}

export default function AnalysisScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { settings } = useUserSettings();
  const params = useLocalSearchParams<Params>();

  const savedId = first(params.id);
  const imageUri = first(params.imageUri);
  const imageName = first(params.imageName);
  const imageType = first(params.imageType);
  const requestId = first(params.requestId);

  // Cada navegación a esta pestaña trae un `requestId` nuevo: o bien abre un
  // análisis guardado (`id`) o bien lanza uno nuevo (`imageUri`).
  const navJob = useMemo<NavJob | null>(() => {
    if (!requestId) return null;
    if (savedId) return { kind: "open", requestId, id: savedId };
    if (imageUri) {
      return {
        kind: "analyze",
        requestId,
        image: { uri: imageUri, fileName: imageName, mimeType: imageType },
      };
    }
    return null;
  }, [imageName, imageType, imageUri, requestId, savedId]);

  const [state, setState] = useState<ScreenState>(IDLE);
  const [settledRequestId, setSettledRequestId] = useState<string>();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!navJob || handledRequests.has(navJob.requestId)) return;
    handledRequests.add(navJob.requestId);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const task: Promise<SavedAnalysis | null> =
      navJob.kind === "open"
        ? getAnalysis(navJob.id)
        : analyzeAndSave(navJob.image, controller.signal);

    task
      .then((saved) => {
        if (controller.signal.aborted) return;
        if (!saved) {
          Alert.alert("Análisis no encontrado", "Puede que lo hayas borrado.");
        }
        setState({
          current: saved,
          previewUri: saved?.imageUri ?? null,
          busy: false,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        showAnalysisError(error);
        setState({
          current: null,
          previewUri: navJob.kind === "analyze" ? navJob.image.uri : null,
          busy: false,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setSettledRequestId(navJob.requestId);
        if (abortRef.current === controller) abortRef.current = null;
      });
  }, [navJob]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runLocal = async (image: NutritionImage) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ current: null, previewUri: image.uri, busy: true });
    try {
      const saved = await analyzeAndSave(image, controller.signal);
      if (controller.signal.aborted) return;
      setState({ current: saved, previewUri: saved.imageUri, busy: false });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      showAnalysisError(error);
      setState((previous) => ({ ...previous, busy: false }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const pick = async (
    picker: () => Promise<NutritionImage | null>,
    errorMessage: string,
  ) => {
    try {
      const image = await picker();
      if (image) await runLocal(image);
    } catch {
      Alert.alert("Error", errorMessage);
    }
  };

  const handleCamera = () => pick(takeFoodPhoto, "No se pudo acceder a la cámara.");
  const handleGallery = () =>
    pick(pickFoodPhoto, "No se pudo acceder a la galería.");

  const navPending = navJob !== null && settledRequestId !== navJob.requestId;
  const isLoading = state.busy || navPending;
  const current = navPending ? null : state.current;
  const previewUri =
    navPending && navJob?.kind === "analyze"
      ? navJob.image.uri
      : state.previewUri;

  const handleDelete = () => {
    if (!current) return;
    Alert.alert(
      "Eliminar análisis",
      "Se quitará del historial y del resumen diario.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteAnalysis(current.id);
            setState(IDLE);
            router.replace("/");
          },
        },
      ],
    );
  };

  const analysis = current?.analysis;
  const totals = analysis?.totals;
  const hasResult = current !== null;
  const showEmpty = !isLoading && !hasResult && !previewUri;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + BottomTabInset + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
        <ScreenHeader title="Análisis del plato" />

        {isLoading ? (
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: colors.backgroundElement },
            ]}
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator size="large" color={colors.primary} />
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

        {showEmpty ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <View
              style={[styles.emptyIconCircle, { backgroundColor: colors.primarySoft }]}
            >
              <Text style={styles.emptyIconText} accessibilityElementsHidden>
                🥗
              </Text>
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
                  styles.ctaButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                  Hacer foto
                </Text>
              </Pressable>
              <Pressable
                onPress={handleGallery}
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: colors.primarySoft },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.ctaText, { color: colors.onPrimarySoft }]}>
                  Galería
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!isLoading && hasResult && current ? (
          <>
            <AnalysisOverview
              imageUri={previewUri}
              analysis={analysis}
              analyzedAt={new Date(current.createdAt)}
              dailyCalorieGoal={settings.dailyCalorieGoal}
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
                color={colors.protein}
              />
              <NutritionStat
                label="Carbohidratos"
                value={`${Math.round(totals?.carbohydrates ?? 0)}g`}
                color={colors.carbs}
              />
              <NutritionStat
                label="Grasas"
                value={`${Math.round(totals?.fat ?? 0)}g`}
                color={colors.fat}
                last
              />
            </View>

            <View style={styles.foodHeading}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Alimentos detectados
              </Text>
              <Text style={[styles.count, { color: colors.primary }]}>
                {analysis?.foods.length ?? 0} elementos
              </Text>
            </View>
            <FoodAnalysisList foods={analysis?.foods ?? []} />

            {analysis && analysis.foods.length > 0 ? (
              <View
                style={[styles.insight, { backgroundColor: colors.warningBackground }]}
              >
                <Text
                  style={[
                    styles.insightIcon,
                    {
                      backgroundColor: colors.warningIconBackground,
                      color: colors.warningText,
                    },
                  ]}
                  accessibilityElementsHidden
                >
                  !
                </Text>
                <View style={styles.insightCopy}>
                  <Text style={[styles.insightTitle, { color: colors.warningText }]}>
                    Recomendación del plato
                  </Text>
                  <Text
                    style={[styles.insightText, { color: colors.warningTextMuted }]}
                  >
                    {totals && totals.protein > 20
                      ? "Buen aporte de proteína para la recuperación muscular y la saciedad."
                      : "Plato ligero. Considera añadir una fuente de proteína para equilibrar los macronutrientes."}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <Pressable
                onPress={handleCamera}
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                  Analizar otro plato
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Eliminar este análisis del historial"
              >
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  Eliminar del historial
                </Text>
              </Pressable>
            </View>
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
  last,
}: {
  label: string;
  value: string;
  color: string;
  last?: boolean;
}) {
  const colors = useAppColors();
  return (
    <View
      style={[
        styles.stat,
        !last && { borderRightWidth: 1, borderRightColor: colors.border },
      ]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
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
  ctaButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
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
    paddingLeft: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginBottom: 9 },
  statLabel: { fontSize: 10, lineHeight: 14 },
  statValue: {
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
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 14,
  },
  insight: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    marginTop: 20,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    paddingTop: 6,
    overflow: "hidden",
  },
  insightCopy: { flex: 1, marginLeft: 12 },
  insightTitle: { fontSize: 13, fontWeight: "800" },
  insightText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  footerActions: { marginTop: 24, gap: 12 },
  deleteButton: { alignItems: "center", paddingVertical: 12 },
  deleteText: { fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
