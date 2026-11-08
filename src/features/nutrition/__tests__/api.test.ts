import { supabase } from "@/features/auth/supabase";

import {
  analyzeFood,
  ApiError,
  getAnalysisUrl,
  parseAnalysisResponse,
} from "../api";

describe("getAnalysisUrl", () => {
  it("construye la URL quitando barras finales", () => {
    expect(getAnalysisUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000/food-analysis",
    );
    expect(getAnalysisUrl("https://api.example.com")).toBe(
      "https://api.example.com/food-analysis",
    );
  });

  it("falla con un mensaje claro si no hay URL configurada", () => {
    expect(() => getAnalysisUrl("")).toThrow(ApiError);
    expect(() => getAnalysisUrl(undefined)).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});

describe("parseAnalysisResponse", () => {
  const validBody = JSON.stringify({
    foods: [
      {
        name: "Pechuga de pollo",
        usdaMatch: "Chicken, breast, cooked",
        fdcId: 171505,
        grams: 150,
        calories: 247.5,
        protein: 46.5,
        carbohydrates: 0,
        fat: 5.4,
        confidence: 0.9,
      },
      {
        name: "Platillo exótico",
        usdaMatch: null,
        fdcId: null,
        grams: 100,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
      },
    ],
    totals: { calories: 248, protein: 46.5, carbohydrates: 0, fat: 5.4 },
  });

  it("devuelve el análisis normalizado con nulls y confianza opcional", () => {
    const result = parseAnalysisResponse(validBody, 200);

    expect(result.totals).toEqual({
      calories: 248,
      protein: 46.5,
      carbohydrates: 0,
      fat: 5.4,
    });
    expect(result.foods).toHaveLength(2);
    expect(result.foods[0]).toMatchObject({
      name: "Pechuga de pollo",
      fdcId: 171505,
      confidence: 0.9,
    });
    expect(result.foods[1]).toMatchObject({ usdaMatch: null, fdcId: null });
    expect(result.foods[1]).not.toHaveProperty("confidence");
  });

  it("descarta alimentos sin nombre y rellena números inválidos con 0", () => {
    const body = JSON.stringify({
      foods: [{ name: "", grams: 10 }, { name: "Arroz", grams: "x" }],
      totals: { calories: "NaN" },
    });
    const result = parseAnalysisResponse(body, 200);
    expect(result.foods).toEqual([
      {
        name: "Arroz",
        usdaMatch: null,
        fdcId: null,
        grams: 0,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
      },
    ]);
    expect(result.totals.calories).toBe(0);
  });

  it("usa el mensaje del servidor en errores HTTP", () => {
    const body = JSON.stringify({ statusCode: 400, message: "Image is required" });
    expect(() => parseAnalysisResponse(body, 400)).toThrow("Image is required");
  });

  it("traduce 413 y 429 a mensajes útiles", () => {
    expect(() => parseAnalysisResponse("{}", 413)).toThrow(/demasiado grande/);
    expect(() => parseAnalysisResponse("{}", 429)).toThrow(/demasiadas peticiones/);
  });

  it("detecta HTML de un proxy caído", () => {
    expect(() =>
      parseAnalysisResponse("<!DOCTYPE html><html>Bad gateway</html>", 502),
    ).toThrow(/no está disponible/);
  });

  it("avisa cuando el cuerpo no es JSON", () => {
    expect(() => parseAnalysisResponse("nope", 200)).toThrow(/JSON válido/);
  });
});

// `new File(uri)` necesita el módulo nativo; en el test basta con un constructor vacío.
jest.mock("expo-file-system", () => ({ File: jest.fn() }));

describe("analyzeFood", () => {
  const image = { uri: "file:///tmp/food.jpg", mimeType: "image/jpeg" };
  const originalFetch = globalThis.fetch;
  const originalFormData = globalThis.FormData;
  const fetchMock = jest.fn();
  const getSession = jest.mocked(supabase.auth.getSession);
  const supabaseSignOut = jest.mocked(supabase.auth.signOut);

  const respond = (status: number, body: unknown) =>
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    });

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000";
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    globalThis.FormData = class {
      append = jest.fn();
    } as unknown as typeof FormData;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    globalThis.FormData = originalFormData;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    fetchMock.mockReset();
    supabaseSignOut.mockClear();
    getSession.mockResolvedValue({
      data: { session: { access_token: "token-abc" } },
      error: null,
    } as never);
  });

  it("envía la cabecera Authorization con el access_token de la sesión", async () => {
    respond(200, { foods: [], totals: {} });

    await analyzeFood(image);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/food-analysis",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      }),
    );
  });

  it("no añade Authorization si no hay sesión", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    respond(200, { foods: [], totals: {} });

    await analyzeFood(image);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("cierra sesión y avisa de sesión caducada ante un 401", async () => {
    respond(401, { statusCode: 401, message: "Unauthorized" });

    await expect(analyzeFood(image)).rejects.toThrow(
      "Sesión caducada, vuelve a entrar",
    );
    expect(supabaseSignOut).toHaveBeenCalledTimes(1);
  });

  it("no cierra sesión con otros errores", async () => {
    respond(400, { statusCode: 400, message: "Image is required" });

    await expect(analyzeFood(image)).rejects.toThrow("Image is required");
    expect(supabaseSignOut).not.toHaveBeenCalled();
  });
});
