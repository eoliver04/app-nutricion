import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomTabInset, Colors, MaxContentWidth } from "@/constants/theme";

export default function ProfileScreen() {
  const colors = Colors[useColorScheme() === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [metricUnitsEnabled, setMetricUnitsEnabled] = useState(true);
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + BottomTabInset + 32,
      }}
    >
      <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={styles.back}
            accessibilityLabel="Volver"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mi perfil
          </Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>ER</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            Elena Rodríguez
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            elena.rodriguez@email.com
          </Text>
          <Pressable style={styles.editButton}>
            <Text style={styles.editText}>Editar perfil</Text>
          </Pressable>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tus objetivos
        </Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <SettingRow label="Objetivo diario" value="2,000 kcal" />
          <SettingRow label="Peso actual" value="64 kg" />
          <SettingRow label="Meta" value="Ganar músculo" />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferencias
        </Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.preference}>
            <View>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Notificaciones
              </Text>
              <Text
                style={[styles.preferenceText, { color: colors.textSecondary }]}
              >
                Recordatorios de comidas
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#CCD8D2", true: "#8CE0BC" }}
              thumbColor="#1A9B6B"
            />
          </View>
          <View style={styles.preference}>
            <View>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Unidades métricas
              </Text>
              <Text
                style={[styles.preferenceText, { color: colors.textSecondary }]}
              >
                {" "}
                gramos y kilogramos
              </Text>
            </View>
            <Switch
              value={metricUnitsEnabled}
              onValueChange={setMetricUnitsEnabled}
              trackColor={{ false: "#CCD8D2", true: "#8CE0BC" }}
              thumbColor="#1A9B6B"
            />
          </View>
        </View>
        <Pressable onPress={() => router.replace("/")} style={styles.logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
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
    marginBottom: 28,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F0F8F4",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#17211D", fontSize: 30, lineHeight: 30 },
  spacer: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  profileHero: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { color: "#137951", fontSize: 25, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800" },
  email: { fontSize: 12, marginTop: 5 },
  editButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#D7F4E8",
  },
  editText: { color: "#176547", fontSize: 12, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  card: { borderRadius: 18, paddingHorizontal: 16, marginBottom: 26 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 140, 130, 0.15)",
  },
  settingLabel: { color: "#81908A", fontSize: 13 },
  settingValue: { color: "#17211D", fontSize: 13, fontWeight: "700" },
  preference: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 140, 130, 0.15)",
  },
  preferenceTitle: { fontSize: 13, fontWeight: "700" },
  preferenceText: { fontSize: 11, marginTop: 4 },
  logout: { alignItems: "center", paddingVertical: 15 },
  logoutText: { color: "#D16054", fontSize: 13, fontWeight: "800" },
});
