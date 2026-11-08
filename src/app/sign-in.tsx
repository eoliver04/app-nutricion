import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthInput, type AuthInputHandle } from "@/components/ui/auth-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MaxContentWidth } from "@/constants/theme";
import {
  signIn,
  signUp,
  type FieldErrors,
} from "@/features/auth/auth-api";
import { useSession } from "@/features/auth/use-session";
import { useAppColors } from "@/hooks/use-app-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Mode = "sign-in" | "sign-up";

const CONFIRM_EMAIL_MESSAGE = "Revisa tu correo para confirmar la cuenta";

/**
 * Pantalla de acceso. El layout raíz la muestra cuando no hay sesión; si se
 * abre como ruta con sesión activa, redirige al inicio.
 */
export default function SignInScreen() {
  const { session } = useSession();
  if (session) return <Redirect href="/" />;
  return <SignInForm />;
}

async function errorFeedback(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Sin motor háptico: ignoramos.
  }
}

export function SignInForm() {
  const colors = useAppColors();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const emailRef = useRef<AuthInputHandle>(null);
  const passwordRef = useRef<AuthInputHandle>(null);

  const isSignUp = mode === "sign-up";

  const clearFeedback = () => {
    setFieldErrors({});
    setFormError(null);
    setNotice(null);
  };

  const toggleMode = () => {
    setMode(isSignUp ? "sign-in" : "sign-up");
    clearFeedback();
  };

  const clearField = (field: keyof FieldErrors) => {
    setFormError(null);
    if (fieldErrors[field]) {
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearFeedback();
    try {
      const result = isSignUp
        ? await signUp({ name, email, password })
        : await signIn(email, password);

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setShakeKey((previous) => previous + 1);
        void errorFeedback();
        return;
      }
      if (result.error) {
        setFormError(result.error);
        void errorFeedback();
        return;
      }
      if (isSignUp && "needsEmailConfirmation" in result && result.needsEmailConfirmation) {
        setNotice(CONFIRM_EMAIL_MESSAGE);
        setMode("sign-in");
        setPassword("");
      }
      // Con sesión, el layout raíz desmonta esta pantalla con un fundido.
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStyle = isDark
    ? { backgroundColor: colors.backgroundElement, borderColor: colors.border }
    : { backgroundColor: colors.background, borderColor: "transparent" };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.background]}
        locations={[0, 0.65]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={styles.logoWrapper}
            >
              <View style={[styles.logoFrame, { backgroundColor: colors.background }]}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logo}
                  contentFit="cover"
                  accessibilityLabel="Logo de NutriAI"
                />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={styles.titleBlock}
            >
              <Text style={[styles.brand, { color: colors.onPrimary }]}>NutriAI</Text>
              <Text style={[styles.tagline, { color: colors.onPrimaryMuted }]}>
                Tus comidas, en una foto
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(200).duration(500)}
              layout={LinearTransition.duration(250)}
              style={[styles.card, cardStyle, !isDark && styles.cardShadow]}
            >
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                accessibilityRole="header"
              >
                {isSignUp ? "Crea tu cuenta" : "Bienvenido de nuevo"}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {isSignUp
                  ? "Guarda tus análisis y objetivos."
                  : "Entra para analizar tus platos."}
              </Text>

              {isSignUp ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  layout={LinearTransition.duration(250)}
                >
                  <AuthInput
                    icon="person-outline"
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      clearField("name");
                    }}
                    placeholder="Tu nombre"
                    error={fieldErrors.name}
                    shakeKey={shakeKey}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    submitBehavior="submit"
                    editable={!isSubmitting}
                    maxLength={60}
                    accessibilityLabel="Nombre"
                  />
                </Animated.View>
              ) : null}

              <Animated.View layout={LinearTransition.duration(250)}>
                <AuthInput
                  ref={emailRef}
                  icon="mail-outline"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearField("email");
                  }}
                  placeholder="tu@email.com"
                  error={fieldErrors.email}
                  shakeKey={shakeKey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  submitBehavior="submit"
                  editable={!isSubmitting}
                  accessibilityLabel="Email"
                />
                <AuthInput
                  ref={passwordRef}
                  icon="lock-closed-outline"
                  isPassword
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearField("password");
                  }}
                  placeholder={isSignUp ? "Mínimo 8 caracteres" : "Contraseña"}
                  error={fieldErrors.password}
                  shakeKey={shakeKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  textContentType={isSignUp ? "newPassword" : "password"}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  editable={!isSubmitting}
                  accessibilityLabel="Contraseña"
                />

                {formError ? (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={[
                      styles.banner,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderLeftColor: colors.danger,
                      },
                    ]}
                    accessibilityLiveRegion="polite"
                  >
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={[styles.bannerText, { color: colors.danger }]}>
                      {formError}
                    </Text>
                  </Animated.View>
                ) : null}
                {notice ? (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={[
                      styles.banner,
                      {
                        backgroundColor: colors.primarySoft,
                        borderLeftColor: colors.primary,
                      },
                    ]}
                    accessibilityLiveRegion="polite"
                  >
                    <Ionicons
                      name="mail-unread-outline"
                      size={18}
                      color={colors.onPrimarySoft}
                    />
                    <Text style={[styles.bannerText, { color: colors.onPrimarySoft }]}>
                      {notice}
                    </Text>
                  </Animated.View>
                ) : null}

                <View style={styles.buttonWrapper}>
                  <PrimaryButton
                    label={isSignUp ? "Crear cuenta" : "Entrar"}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                  />
                </View>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(300).duration(400)}>
              <Pressable
                onPress={toggleMode}
                disabled={isSubmitting}
                style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  {isSignUp ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
                  <Text style={[styles.switchAction, { color: colors.primary }]}>
                    {isSignUp ? "Entrar" : "Crear cuenta"}
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
  logoWrapper: { alignItems: "center", marginBottom: 14 },
  logoFrame: {
    width: 84,
    height: 84,
    borderRadius: 24,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: { width: "100%", height: "100%", borderRadius: 18 },
  titleBlock: { alignItems: "center", marginBottom: 28 },
  brand: { fontSize: 30, fontWeight: "800", letterSpacing: 0.3 },
  tagline: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardShadow: {
    shadowColor: "#17211D",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: "800" },
  cardSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  buttonWrapper: { marginTop: 6 },
  switchButton: { alignItems: "center", paddingVertical: 10 },
  switchText: { fontSize: 14 },
  switchAction: { fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
