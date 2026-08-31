const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface QuestionOption {
  _id?: string;
  label: string;
  votes: number;
}

export interface Question {
  _id: string;
  session: string;
  text: string;
  order: number;
  options: QuestionOption[];
  status: "pending" | "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

export class QuestionError extends Error {}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("reagis_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// GET /api/questions/session/:sessionId
export async function getQuestionsBySession(sessionId: string): Promise<Question[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions/session/${sessionId}`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new QuestionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new QuestionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new QuestionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// POST /api/questions
export async function createQuestion(data: {
  session: string;
  text: string;
  order: number;
  options: { label: string }[];
}): Promise<Question> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  } catch {
    throw new QuestionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new QuestionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new QuestionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// PATCH /api/questions/:id
export async function updateQuestion(
  id: string,
  data: { text?: string; options?: { label: string }[] }
): Promise<Question> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  } catch {
    throw new QuestionError("Impossible de contacter le serveur.");
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new QuestionError("Reponse du serveur invalide.");
  }

  if (!response.ok) {
    throw new QuestionError(body.message ?? "Erreur serveur");
  }

  return body;
}

// DELETE /api/questions/:id
export async function deleteQuestion(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new QuestionError("Impossible de contacter le serveur.");
  }

  if (!response.ok) {
    let body: any;
    try {
      body = await response.json();
    } catch {
      throw new QuestionError("Erreur serveur");
    }
    throw new QuestionError(body.message ?? "Erreur serveur");
  }
}
