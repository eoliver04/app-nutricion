import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";

import { getSupabaseConfig } from "@/constants/supabase";

type SessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** En nativo la sesión vive en el llavero/keystore del dispositivo. */
const secureStoreStorage: SessionStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

/** expo-secure-store no existe en web: usamos localStorage si está disponible. */
const webStorage: SessionStorage = {
  getItem: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key, value) => {
    globalThis.localStorage?.setItem(key, value);
  },
  removeItem: async (key) => {
    globalThis.localStorage?.removeItem(key);
  },
};

const { url, anonKey } = getSupabaseConfig();

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === "web" ? webStorage : secureStoreStorage,
    persistSession: true,
    autoRefreshToken: true,
    // No hay URL de la que recuperar la sesión en una app nativa.
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// El refresco automático solo tiene sentido con la app en primer plano.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
