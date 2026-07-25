// Statuts possibles d'une session — doit correspondre à l'enum du schema Mongoose Session.

export const SessionStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export type SessionStatusValue = (typeof SessionStatus)[keyof typeof SessionStatus];
