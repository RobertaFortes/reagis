// Une session = une room Socket.io. Le préfixe évite toute collision avec
// d'autres usages de rooms (Socket.io met déjà chaque socket dans une room
// portant son propre id).
export const sessionRoom = (sessionId: string) => `session:${sessionId}`;
