import type { Session } from "@supabase/supabase-js";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { supabase } from "../supabase";
import { useSession } from "../use-session";

type AuthCallback = (event: string, session: Session | null) => void;

const fakeSession = {
  access_token: "token-123",
  user: { id: "user-1", email: "a@b.com" },
} as unknown as Session;

const getSession = jest.mocked(supabase.auth.getSession);
const onAuthStateChange = jest.mocked(supabase.auth.onAuthStateChange);

describe("useSession", () => {
  let unsubscribe: jest.Mock;
  let emit: AuthCallback | undefined;

  beforeEach(() => {
    unsubscribe = jest.fn();
    emit = undefined;
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChange.mockImplementation((callback) => {
      emit = callback as AuthCallback;
      return { data: { subscription: { unsubscribe } } } as never;
    });
  });

  it("está cargando mientras no se ha leído la sesión persistida", async () => {
    getSession.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useSession());

    expect(result.current).toEqual({ session: null, loading: true });
  });

  it("termina sin sesión si no hay ninguna guardada", async () => {
    const { result } = await renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it("devuelve la sesión persistida", async () => {
    getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const { result } = await renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBe(fakeSession);
  });

  it("se actualiza con los cambios de autenticación", async () => {
    const { result } = await renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => emit?.("SIGNED_IN", fakeSession));
    expect(result.current.session).toBe(fakeSession);

    await act(async () => emit?.("SIGNED_OUT", null));
    expect(result.current.session).toBeNull();
  });

  it("cancela la suscripción al desmontar", async () => {
    const { result, unmount } = await renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("deja de cargar aunque getSession falle", async () => {
    getSession.mockRejectedValue(new Error("boom"));

    const { result } = await renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });
});
