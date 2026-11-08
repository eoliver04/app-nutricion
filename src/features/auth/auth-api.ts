import { supabase } from "./supabase";

export type FieldErrors = { name?: string; email?: string; password?: string };

export type AuthResult = {
  /** Mensaje general (de Supabase o de red). `null` si todo fue bien. */
  error: string | null;
  /** Errores de validación local, por campo. Solo presente si los hay. */
  fieldErrors?: FieldErrors;
};

export type SignUpInput = { name: string; email: string; password: string };

export type SignUpResult = AuthResult & {
  /** Supabase exige confirmar el email antes de poder entrar. */
  needsEmailConfirmation: boolean;
};

export const SESSION_EXPIRED_MESSAGE = "Sesión caducada, vuelve a entrar";

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NETWORK_MESSAGE =
  "No se pudo conectar con el servicio de autenticación. Comprueba tu conexión.";

/** Traduce los códigos de error de Supabase Auth a mensajes para el usuario. */
const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu email antes de entrar. Revisa tu bandeja de entrada.",
  user_already_exists: "Ya existe una cuenta con ese email.",
  email_exists: "Ya existe una cuenta con ese email.",
  weak_password: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  email_address_invalid: "El email no es válido.",
  validation_failed: "Revisa el email y la contraseña.",
  over_request_rate_limit: "Demasiados intentos seguidos. Espera un minuto.",
  over_email_send_rate_limit: "Demasiados intentos seguidos. Espera un minuto.",
  signup_disabled: "El registro está desactivado en este momento.",
  user_banned: "Esta cuenta está bloqueada.",
};

const MESSAGES_BY_PATTERN: [RegExp, string][] = [
  [/invalid login credentials/i, MESSAGES_BY_CODE.invalid_credentials],
  [/email not confirmed/i, MESSAGES_BY_CODE.email_not_confirmed],
  [/already registered|already exists/i, MESSAGES_BY_CODE.user_already_exists],
  [/password should be/i, MESSAGES_BY_CODE.weak_password],
  [/invalid format|invalid email/i, MESSAGES_BY_CODE.email_address_invalid],
  [/rate limit/i, MESSAGES_BY_CODE.over_request_rate_limit],
  [/failed to fetch|network request failed|fetch failed/i, NETWORK_MESSAGE],
];

/** Convierte cualquier error (de Supabase o de red) en un texto en español. */
export function toAuthMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  const { code, message, name } = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
  };
  if (typeof code === "string" && MESSAGES_BY_CODE[code]) {
    return MESSAGES_BY_CODE[code];
  }
  if (name === "AuthRetryableFetchError") return NETWORK_MESSAGE;
  if (typeof message === "string") {
    const match = MESSAGES_BY_PATTERN.find(([pattern]) => pattern.test(message));
    if (match) return match[1];
  }
  return fallback;
}

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export function validateName(name: string): string | undefined {
  const clean = name.trim();
  if (clean === "") return "Introduce tu nombre.";
  if (clean.length < NAME_MIN_LENGTH) {
    return `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`;
  }
  if (clean.length > NAME_MAX_LENGTH) {
    return `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`;
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const clean = normalizeEmail(email);
  if (clean === "") return "Introduce tu email.";
  if (!EMAIL_PATTERN.test(clean)) return "El email no es válido.";
  return undefined;
}

export function validatePassword(
  password: string,
  options: { minLength: number } = { minLength: PASSWORD_MIN_LENGTH },
): string | undefined {
  if (password === "") return "Introduce tu contraseña.";
  if (password.length < options.minLength) {
    return `La contraseña debe tener al menos ${options.minLength} caracteres.`;
  }
  return undefined;
}

const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some(Boolean);

const firstMessage = (errors: FieldErrors): string =>
  errors.name ?? errors.email ?? errors.password ?? "Revisa los campos.";

/** Inicia sesión con email y contraseña. Nunca lanza: devuelve `error` legible. */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  // Al entrar solo exigimos que la contraseña no esté vacía: la longitud
  // mínima se aplica al crear la cuenta.
  const fieldErrors: FieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password, { minLength: 1 }),
  };
  if (hasErrors(fieldErrors)) {
    return { error: firstMessage(fieldErrors), fieldErrors };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) return { error: toAuthMessage(error, "No se pudo iniciar sesión.") };
    return { error: null };
  } catch (error: unknown) {
    return { error: toAuthMessage(error, "No se pudo iniciar sesión.") };
  }
}

/**
 * Crea una cuenta. El nombre viaja en `options.data.name`: un trigger de la
 * base de datos lo copia a `public.profiles`, así que no hace falta más.
 * Nunca lanza: devuelve `error` legible.
 */
export async function signUp({
  name,
  email,
  password,
}: SignUpInput): Promise<SignUpResult> {
  const fieldErrors: FieldErrors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  if (hasErrors(fieldErrors)) {
    return {
      error: firstMessage(fieldErrors),
      fieldErrors,
      needsEmailConfirmation: false,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      return {
        error: toAuthMessage(error, "No se pudo crear la cuenta."),
        needsEmailConfirmation: false,
      };
    }
    // Con la confirmación por email activa, Supabase responde a un email ya
    // registrado con un usuario "fantasma" sin identidades en vez de un error.
    if (data.user && data.user.identities?.length === 0) {
      return {
        error: MESSAGES_BY_CODE.user_already_exists,
        needsEmailConfirmation: false,
      };
    }
    return { error: null, needsEmailConfirmation: data.session === null };
  } catch (error: unknown) {
    return {
      error: toAuthMessage(error, "No se pudo crear la cuenta."),
      needsEmailConfirmation: false,
    };
  }
}

/** Cierra la sesión y borra el token del dispositivo. Nunca lanza. */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: toAuthMessage(error, "No se pudo cerrar la sesión.") };
    return { error: null };
  } catch (error: unknown) {
    return { error: toAuthMessage(error, "No se pudo cerrar la sesión.") };
  }
}
