/**
 * Configuración pública de Supabase. Las variables EXPO_PUBLIC_* se inyectan
 * en tiempo de build, así que hay que leerlas con su nombre literal.
 *
 * Nunca uses aquí la `service_role` key: esta app es un cliente público.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type SupabaseConfig = { url: string; anonKey: string };

const isSet = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim() !== "";

export function getSupabaseConfig(
  url: string | undefined = SUPABASE_URL,
  anonKey: string | undefined = SUPABASE_ANON_KEY,
): SupabaseConfig {
  if (!isSet(url) || !isSet(anonKey)) {
    throw new Error(
      "Falta configurar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo .env.",
    );
  }
  return { url: url.trim().replace(/\/+$/, ""), anonKey: anonKey.trim() };
}
