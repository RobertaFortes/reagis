const TOKEN_KEY = "reagis_token";
const USER_KEY = "reagis_user";

export interface StoredUser {
  id?: string;
  name?: string;
  email?: string;
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Token présent et non expiré (lecture du claim `exp`, sans vérifier la signature). */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.exp !== "number" || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** fetch qui purge la session et renvoie vers l'accueil sur 401. */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && getToken()) {
    clearAuth();
    window.location.replace("/");
  }
  return response;
}
