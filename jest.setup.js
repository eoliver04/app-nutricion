// AsyncStorage no tiene módulo nativo en Jest: usamos su mock oficial en memoria.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// expo-secure-store tampoco tiene módulo nativo: almacén en memoria.
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

// Supabase: cliente falso con las funciones de auth que usa la app. Cada test
// ajusta las respuestas con `jest.mocked(supabase.auth.<fn>).mockResolvedValue`.
jest.mock("@supabase/supabase-js", () => {
  const auth = {
    getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn(async () => ({
      data: { user: null, session: null },
      error: null,
    })),
    signUp: jest.fn(async () => ({
      data: { user: null, session: null },
      error: null,
    })),
    signOut: jest.fn(async () => ({ error: null })),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  return {
    createClient: jest.fn(() => ({ auth })),
    processLock: jest.fn(),
  };
});

process.env.EXPO_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
