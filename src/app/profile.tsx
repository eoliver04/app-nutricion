import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { clearAnalyses } from "@/features/nutrition/storage";
import {
  normalizeSettings,
  type UserSettings,
} from "@/features/profile/settings";
import { useUserSettings } from "@/features/profile/use-user-settings";
import { useAppColors } from "@/hooks/use-app-colors";

type Draft = Record<keyof UserSettings, string>;

const toDraft = (settings: UserSettings): Draft => ({
  name: settings.name,
  dailyCalorieGoal: String(settings.dailyCalorieGoal),
  proteinGoal: String(settings.proteinGoal),
  carbsGoal: String(settings.carbsGoal),
  fatGoal: String(settings.fatGoal),
});

const GOAL_FIELDS: { key: keyof Draft; label: string; unit: string }[] = [
  { key: "dailyCalorieGoal", label: "Objetivo diario", unit: "kcal" },
  { key: "proteinGoal", label: "Proteínas", unit: "g" },
  { key: "carbsGoal", label: "Carbohidratos", unit: "g" },
  { key: "fatGoal", label: "Grasas", unit: "g" },
];

export default function ProfileScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { settings, isLoading, update } = useUserSettings();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
          <ScreenHeader title="Mi perfil" />
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <ProfileForm initial={settings} onSave={update} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileForm({
  initial,
  onSave,
}: {
  initial: UserSettings;
  onSave: (settings: UserSettings) => Promise<UserSettings>;
}) {
  const colors = useAppColors();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [isSaving, setIsSaving] = useState(false);

  const setField = (key: keyof Draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await onSave(
        normalizeSettings({
          name: draft.name,
          dailyCalorieGoal: Number(draft.dailyCalorieGoal),
          proteinGoal: Number(draft.proteinGoal),
          carbsGoal: Number(draft.carbsGoal),
          fatGoal: Number(draft.fatGoal),
        }),
      );
      setDraft(toDraft(saved));
      Alert.alert("Guardado", "Tus objetivos se han actualizado.");
    } catch {
      Alert.alert("Error", "No se pudieron guardar los ajustes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Borrar historial",
      "Se eliminarán todos los análisis guardados en este dispositivo. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await clearAnalyses();
            Alert.alert("Historial borrado");
          },
        },
      ],
    );
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre ti</Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.fieldRow}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Nombre
          </Text>
          <TextInput
            value={draft.name}
            onChangeText={(value) => setField("name", value)}
            placeholder="¿Cómo te llamas?"
            placeholderTextColor={colors.textSecondary}
            maxLength={40}
            autoCapitalize="words"
            style={[styles.input, { color: colors.text }]}
            accessibilityLabel="Nombre"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Tus objetivos
      </Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        {GOAL_FIELDS.map((field, index) => (
          <View
            key={field.key}
            style={[
              styles.fieldRow,
              index < GOAL_FIELDS.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {field.label}
            </Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={draft[field.key]}
                onChangeText={(value) =>
                  setField(field.key, value.replace(/[^\d]/g, ""))
                }
                keyboardType="number-pad"
                maxLength={5}
                style={[styles.input, styles.numberInput, { color: colors.text }]}
                accessibilityLabel={`${field.label} en ${field.unit}`}
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                {field.unit}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={isSaving}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: colors.primary },
          (pressed || isSaving) && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSaving, busy: isSaving }}
      >
        <Text style={[styles.saveText, { color: colors.onPrimary }]}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos</Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tus análisis y objetivos se guardan solo en este dispositivo. Las fotos
          se envían al servidor únicamente para analizarlas.
        </Text>
      </View>
      <Pressable
        onPress={handleClearHistory}
        style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={[styles.dangerText, { color: colors.danger }]}>
          Borrar historial de análisis
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
  loader: { marginTop: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  card: { borderRadius: 18, paddingHorizontal: 16, marginBottom: 26 },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    minHeight: 56,
    gap: 12,
  },
  fieldLabel: { fontSize: 13 },
  input: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    paddingVertical: 6,
  },
  inputWithUnit: { flexDirection: "row", alignItems: "center", gap: 6 },
  numberInput: { minWidth: 70 },
  unit: { fontSize: 12 },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 32,
  },
  saveText: { fontSize: 14, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17, paddingVertical: 14 },
  dangerButton: { alignItems: "center", paddingVertical: 12 },
  dangerText: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
