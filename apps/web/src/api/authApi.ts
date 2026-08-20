// Adapter à votre config : si vous utilisez Vite, définissez VITE_API_URL
// dans un .env (ex: VITE_API_URL=http://localhost:5000/api/auth).
// Sans variable définie, on part du principe que le router est monté sur /api/auth.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthSuccessResponse {
  result: true;
  token: string;
  user: AuthUser;
}

interface AuthErrorResponse {
  result: false;
  error: string;
}

type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

// Fonction de garde de type : contrairement à un simple `if (!data.result)`,
// un type predicate ("data is AuthErrorResponse") force TypeScript à
// narrower correctement, sans dépendre de subtilités du compilateur.
function isAuthErrorResponse(data: AuthResponse): data is AuthErrorResponse {
  return data.result === false;
}

export class AuthError extends Error {}

//SIGNUP
export interface SignupSuccessResponse {
  result: true;
  user: AuthUser;
}

export async function signup(email: string, password: string,  name: string): Promise<SignupSuccessResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });
  } catch {
    throw new AuthError(
      "Impossible de contacter le serveur. Vérifiez votre connexion."
    );
  }

  let data: SignupSuccessResponse | AuthErrorResponse;

  try {
    data = await response.json();
  } catch {
    throw new AuthError("Réponse du serveur invalide.");
  }

  if (!response.ok || data.result === false) {
    throw new AuthError(
      data.result === false ? data.error : "Erreur serveur"
    );
  }

  return data;
}



//LOGIN
export async function login(email: string, password: string): Promise<AuthSuccessResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // Erreur réseau (serveur injoignable, pas de connexion, etc.)
    throw new AuthError("Impossible de contacter le serveur. Vérifiez votre connexion.");
  }

  let data: AuthResponse;
  try {
    data = await response.json();
  } catch {
    throw new AuthError("Réponse du serveur invalide.");
  }

  if (isAuthErrorResponse(data)) {
    throw new AuthError(data.error);
  }

  // Cas limite : result === true mais statut HTTP non-2xx
  // (ne devrait pas arriver avec ce backend, mais on reste défensif).
  if (!response.ok) {
    throw new AuthError("Erreur serveur");
  }

  return data;
}
