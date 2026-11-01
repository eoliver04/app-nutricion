import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type UserSettings,
} from "./settings";

/** Ajustes del usuario, recargados al enfocar la pantalla. */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSettings().then((loaded) => {
        if (active) {
          setSettings(loaded);
          setIsLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const update = useCallback(async (next: UserSettings) => {
    const saved = await saveSettings(next);
    setSettings(saved);
    return saved;
  }, []);

  return { settings, isLoading, update };
}
