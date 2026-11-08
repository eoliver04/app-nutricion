import {
  signIn,
  signOut,
  signUp,
  toAuthMessage,
  validateName,
  validatePassword,
} from "../auth-api";
import { supabase } from "../supabase";

const signInWithPassword = jest.mocked(supabase.auth.signInWithPassword);
const supabaseSignUp = jest.mocked(supabase.auth.signUp);
const supabaseSignOut = jest.mocked(supabase.auth.signOut);

const ok = { data: { user: null, session: null }, error: null } as never;
const authError = (code: string, message = "") =>
  ({ data: { user: null, session: null }, error: { code, message } }) as never;

const validSignUp = { name: "Ana", email: "a@b.com", password: "secreto123" };

beforeEach(() => {
  jest.clearAllMocks();
  signInWithPassword.mockResolvedValue(ok);
  supabaseSignUp.mockResolvedValue(ok);
  supabaseSignOut.mockResolvedValue({ error: null });
});

describe("signIn", () => {
  it("normaliza el email y devuelve sin error", async () => {
    await expect(signIn("  Ana@Example.com ", "secreto")).resolves.toEqual({
      error: null,
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "secreto",
    });
  });

  it("valida los campos antes de llamar a Supabase", async () => {
    expect(await signIn("", "x")).toMatchObject({
      error: "Introduce tu email.",
      fieldErrors: { email: "Introduce tu email." },
    });
    expect((await signIn("no-es-email", "x")).fieldErrors).toEqual({
      email: "El email no es válido.",
      password: undefined,
    });
    expect((await signIn("a@b.com", "")).fieldErrors?.password).toBe(
      "Introduce tu contraseña.",
    );
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("no exige longitud mínima de contraseña al entrar", async () => {
    expect((await signIn("a@b.com", "abc")).error).toBeNull();
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("traduce credenciales inválidas", async () => {
    signInWithPassword.mockResolvedValue(
      authError("invalid_credentials", "Invalid login credentials"),
    );
    expect((await signIn("a@b.com", "mal")).error).toBe(
      "Email o contraseña incorrectos.",
    );
  });

  it("no lanza si la llamada falla por red", async () => {
    signInWithPassword.mockRejectedValue(new TypeError("Network request failed"));
    const result = await signIn("a@b.com", "secreto");
    expect(result.error).toMatch(/conexión/);
  });
});

describe("signUp", () => {
  it("envía el nombre recortado en options.data", async () => {
    await signUp({ ...validSignUp, name: "  Ana García  " });

    expect(supabaseSignUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secreto123",
      options: { data: { name: "Ana García" } },
    });
  });

  it("rechaza datos inválidos sin llamar a Supabase", async () => {
    const tooShortName = await signUp({ ...validSignUp, name: "A" });
    expect(tooShortName.fieldErrors?.name).toMatch(/al menos 2/);

    const tooLongName = await signUp({ ...validSignUp, name: "x".repeat(61) });
    expect(tooLongName.fieldErrors?.name).toMatch(/superar 60/);

    const badEmail = await signUp({ ...validSignUp, email: "ana@" });
    expect(badEmail.fieldErrors?.email).toBe("El email no es válido.");

    const shortPassword = await signUp({ ...validSignUp, password: "1234567" });
    expect(shortPassword.fieldErrors?.password).toMatch(/al menos 8/);

    const allWrong = await signUp({ name: "", email: "", password: "" });
    expect(allWrong.fieldErrors).toEqual({
      name: "Introduce tu nombre.",
      email: "Introduce tu email.",
      password: "Introduce tu contraseña.",
    });
    expect(allWrong.error).toBe("Introduce tu nombre.");
    expect(allWrong.needsEmailConfirmation).toBe(false);

    expect(supabaseSignUp).not.toHaveBeenCalled();
  });

  it("indica que hace falta confirmar el email cuando no hay sesión", async () => {
    supabaseSignUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{ id: "i1" }] }, session: null },
      error: null,
    } as never);
    await expect(signUp(validSignUp)).resolves.toEqual({
      error: null,
      needsEmailConfirmation: true,
    });
  });

  it("entra directamente si Supabase devuelve sesión", async () => {
    supabaseSignUp.mockResolvedValue({
      data: {
        user: { id: "u1", identities: [{ id: "i1" }] },
        session: { access_token: "t" },
      },
      error: null,
    } as never);
    expect(await signUp(validSignUp)).toEqual({
      error: null,
      needsEmailConfirmation: false,
    });
  });

  it("detecta un email ya registrado aunque Supabase no devuelva error", async () => {
    supabaseSignUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [] }, session: null },
      error: null,
    } as never);
    expect((await signUp(validSignUp)).error).toBe(
      "Ya existe una cuenta con ese email.",
    );
  });

  it("traduce el error de usuario existente", async () => {
    supabaseSignUp.mockResolvedValue(authError("user_already_exists"));
    expect((await signUp(validSignUp)).error).toBe(
      "Ya existe una cuenta con ese email.",
    );
  });
});

describe("signOut", () => {
  it("devuelve sin error", async () => {
    await expect(signOut()).resolves.toEqual({ error: null });
    expect(supabaseSignOut).toHaveBeenCalledTimes(1);
  });

  it("no lanza si Supabase falla", async () => {
    supabaseSignOut.mockRejectedValue(new Error("boom"));
    expect((await signOut()).error).toBe("No se pudo cerrar la sesión.");
  });
});

describe("validadores", () => {
  it("aceptan los límites exactos", () => {
    expect(validateName("Al")).toBeUndefined();
    expect(validateName("x".repeat(60))).toBeUndefined();
    expect(validatePassword("12345678")).toBeUndefined();
  });
});

describe("toAuthMessage", () => {
  it("usa el código cuando existe y el mensaje como respaldo", () => {
    expect(toAuthMessage({ code: "email_not_confirmed" }, "x")).toMatch(/Confirma/);
    expect(toAuthMessage({ message: "Password should be at least 6" }, "x")).toMatch(
      /al menos 8/,
    );
    expect(toAuthMessage({ name: "AuthRetryableFetchError" }, "x")).toMatch(
      /conexión/,
    );
  });

  it("devuelve el texto por defecto si no reconoce el error", () => {
    expect(toAuthMessage(null, "fallback")).toBe("fallback");
    expect(toAuthMessage({ code: "desconocido", message: "???" }, "fallback")).toBe(
      "fallback",
    );
  });
});
