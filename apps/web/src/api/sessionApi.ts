const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface Session {
  _id: string;
  name: string;
  code: string;
  presenter: string;
  status: "draft" | "active" | "finished";
  reaction: "👍" | "❤️" | "🔥" | "👏";
  reactionCount: number;
  currentQuestionIndex: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class SessionError extends Error {
  code: string;

  constructor(message: string, code: string = "error") {
    super(message);
    this.code = code;
    this.name = "SessionError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("reagis_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// POST /api/sessions
export async function createSession(data: {
  name: string;
  code: string;
  reaction?: Session["reaction"];
}): Promise<Session> {
  const user = localStorage.getItem("reagis_user");
  const presenter = user ? JSON.parse(user).id : undefined;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, presenter }),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// GET /api/sessions/my-sessions
export async function getMySessions(): Promise<Session[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/my-sessions`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// PATCH /api/sessions/:id/start
export async function startSession(id: string): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/${id}/start`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// PATCH /api/sessions/:id/end
export async function endSession(id: string): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/${id}/end`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// GET /api/sessions/:id
export async function getSessionById(id: string): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// POST /api/sessions/code/:code
export async function joinSessionByCode(code: string, deviceId: string): Promise<{ token: string; session: Session }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/code/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceId }),
    });
  } catch {
    throw new SessionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new SessionError("Impossible de contacter le serveur.", "error");
  }

  if (response.status === 404) {
    throw new SessionError("Session introuvable.", "not-found");
  }

  if (!response.ok) {
    throw new SessionError(body.message ?? "Erreur serveur", "error");
  }

  return body; // { token, session }
}