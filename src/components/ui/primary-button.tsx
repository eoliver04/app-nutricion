import * as Haptics from "expo-haptics";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useAppColors } from "@/hooks/use-app-colors";

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

const BUTTON_HEIGHT = 52;

/** Vibración ligera al pulsar; en web no hay motor háptico. */
export async function lightImpact(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Dispositivos sin háptica: ignoramos.
  }
}

/** Botón de acción principal: todo el ancho, escala al pulsar y spinner. */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const colors = useAppColors();
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      onPress={() => {
        void lightImpact();
        onPress();
      }}
      onPressIn={() => {
        scale.set(withSpring(0.97, { damping: 15, stiffness: 300 }));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, { damping: 15, stiffness: 300 }));
      }}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          isInactive && styles.inactive,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  inactive: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: "600" },
});
