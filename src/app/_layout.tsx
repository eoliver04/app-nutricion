import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { SignInForm } from "@/app/sign-in";
import AppTabs from "@/components/app-tabs";
import { useSession } from "@/features/auth/use-session";
import { useAppColors } from "@/hooks/use-app-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = useAppColors();
  const { session, loading } = useSession();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : null}
        {!loading && session ? (
          <Animated.View
            key="tabs"
            entering={FadeIn.duration(250)}
            style={styles.flex}
          >
            <AppTabs />
          </Animated.View>
        ) : null}
        {!loading && !session ? (
          // Capa superior: al conseguir sesión se desvanece sobre las tabs.
          <Animated.View
            key="sign-in"
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(220)}
            style={styles.overlay}
          >
            <SignInForm />
          </Animated.View>
        ) : null}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
});
