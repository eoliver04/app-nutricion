import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { AuthInput } from "@/components/ui/auth-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { signOut } from "@/features/auth/auth-api";
import { useSession } from "@/features/auth/use-session";
import { checkBackend, getBaseUrl, type BackendCheck } from "@/features/nutrition/api";
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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Nombre guardado en Supabase al registrarse, si lo hay. */
function useAccountName(): string {
  const { session } = useSession();
  const metadataName = session?.user.user_metadata?.name;
  return typeof metadataName === "string" ? metadataName.trim() : "";
}

export default function ProfileScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { settings, isLoading, update } = useUserSettings();
  const accountName = useAccountName();

  // Un único nombre en toda la pantalla: el editable. Si aún no se ha
  // guardado ninguno en el dispositivo, arrancamos con el de la cuenta.
  const initialSettings = useMemo(
    () => (settings.name ? settings : { ...settings, name: accountName }),
    [settings, accountName],
  );

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
          <ScreenHeader title="Mi perfil" showBack={false} />
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <ProfileForm
              key={initialSettings.name}
              initial={initialSettings}
              onSave={update}
            />
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuenta</Text>
      <AccountCard displayName={draft.name} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre ti</Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <AuthInput
          label="Nombre"
          icon="person-outline"
          value={draft.name}
          onChangeText={(value) => setField("name", value)}
          placeholder="¿Cómo te llamas?"
          maxLength={40}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          accessibilityLabel="Nombre"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Tus objetivos
      </Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        {GOAL_FIELDS.map((field) => (
          <AuthInput
            key={field.key}
            label={field.label}
            suffix={field.unit}
            value={draft[field.key]}
            onChangeText={(value) =>
              setField(field.key, value.replace(/[^\d]/g, ""))
            }
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="done"
            accessibilityLabel={`${field.label} en ${field.unit}`}
          />
        ))}
      </View>

      <View style={styles.saveButton}>
        <PrimaryButton
          label={isSaving ? "Guardando..." : "Guardar cambios"}
          onPress={handleSave}
          loading={isSaving}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Servidor</Text>
      <BackendStatusCard />

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

function AccountCard({ displayName }: { displayName: string }) {
  const colors = useAppColors();
  const { session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    if (error) {
      setIsSigningOut(false);
      Alert.alert("Error", error);
    }
    // Si sale bien, el layout raíz desmonta esta pantalla al perder la sesión.
  };

  const name = displayName.trim();

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.accountRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimarySoft }]}>
            {initialsOf(name)}
          </Text>
        </View>
        <View style={styles.accountCopy}>
          <Text
            style={[styles.accountName, { color: colors.text }]}
            numberOfLines={1}
          >
            {name || "Sin nombre"}
          </Text>
          <Text
            style={[styles.accountEmail, { color: colors.textSecondary }]}
            numberOfLines={1}
            selectable
          >
            {session?.user.email ?? "—"}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleSignOut}
        disabled={isSigningOut}
        style={({ pressed }) => [
          styles.checkButton,
          { backgroundColor: colors.primarySoft },
          (pressed || isSigningOut) && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
      >
        <Text style={[styles.checkText, { color: colors.onPrimarySoft }]}>
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Text>
      </Pressable>
    </View>
  );
}

function BackendStatusCard() {
  const colors = useAppColors();
  const [result, setResult] = useState<BackendCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  let configuredUrl: string;
  try {
    configuredUrl = getBaseUrl();
  } catch {
    configuredUrl = "(sin configurar)";
  }

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      setResult(await checkBackend());
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.hint, { color: colors.textSecondary }]} selectable>
        URL configurada: {configuredUrl}
      </Text>
      <Pressable
        onPress={handleCheck}
        disabled={isChecking}
        style={({ pressed }) => [
          styles.checkButton,
          { backgroundColor: colors.primarySoft },
          (pressed || isChecking) && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isChecking, busy: isChecking }}
      >
        <Text style={[styles.checkText, { color: colors.onPrimarySoft }]}>
          {isChecking ? "Comprobando..." : "Comprobar conexión con el servidor"}
        </Text>
      </Pressable>
      {result ? (
        <Text
          style={[
            styles.checkResult,
            { color: result.ok ? colors.primary : colors.danger },
          ]}
          selectable
          accessibilityLiveRegion="polite"
        >
          {result.ok
            ? `Conectado (HTTP ${result.status}) en ${result.elapsedMs} ms`
            : `Sin conexión tras ${result.elapsedMs} ms. ${result.detail ?? ""}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
  loader: { marginTop: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    marginBottom: 26,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  accountCopy: { flex: 1, minWidth: 0 },
  accountName: { fontSize: 17, fontWeight: "800" },
  accountEmail: { fontSize: 13, marginTop: 2 },
  saveButton: { marginBottom: 32 },
  hint: { fontSize: 12, lineHeight: 17, paddingBottom: 14 },
  checkButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  checkText: { fontSize: 13, fontWeight: "700" },
  checkResult: { fontSize: 12, lineHeight: 17, paddingBottom: 14 },
  dangerButton: { alignItems: "center", paddingVertical: 12 },
  dangerText: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
