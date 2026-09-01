// Types partagés entre back et web.
// Source de vérité pour les payloads REST et WebSocket.

// ─── Modèles ──────────────────────────────────────────────

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
  status: 'pending' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  _id: string;
  name: string;
  code: string;
  presenter: string;
  status: 'draft' | 'active' | 'paused' | 'finished';
  reaction: '👍' | '❤️' | '🔥' | '👏';
  reactionCount: number;
  currentQuestionIndex: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'presenter' | 'participant';
}

// ─── REST — Auth ──────────────────────────────────────────

export interface AuthSuccessResponse {
  result: true;
  token: string;
  user: AuthUser;
}

export interface SignupSuccessResponse {
  result: true;
  user: AuthUser;
}

export interface AuthErrorResponse {
  result: false;
  error: string;
}

// ─── REST — Enveloppe d'erreur (hors auth) ───────────────

export interface ApiErrorResponse {
  message: string;
}

// ─── REST — Join session ─────────────────────────────────

export interface JoinSessionResponse {
  token: string;
  session: Session;
}

// ─── WebSocket — Payloads client → serveur ───────────────

export interface WsJoinSessionPayload {
  code: string;
  participantToken: string;
}

export interface WsPresenterJoinPayload {
  sessionId: string;
  token: string;
}

export interface WsSubmitVotePayload {
  questionId: string;
  optionIndex: number;
}

export interface WsSendReactionPayload {
  emoji: string;
}

// ─── WebSocket — Payloads serveur → clients ──────────────

export interface WsAckResponse {
  ok: boolean;
  error?: string;
}

export interface WsJoinAckResponse extends WsAckResponse {
  session?: {
    id: string;
    name: string;
    code: string;
    status: string;
    currentQuestionIndex: number;
    reaction: string;
    reactionCount: number;
  };
}

export interface WsVoteUpdatePayload {
  questionId: string;
  options: Array<{ label: string; votes: number }>;
}

export interface WsParticipantCountPayload {
  sessionId: string;
  count: number;
}

export interface WsReactionUpdatePayload {
  sessionId: string;
  count: number;
}

export interface WsQuestionChangedPayload {
  sessionId: string;
  newQuestionIndex: number;
}

export interface WsSessionEndedPayload {
  sessionId: string;
}
