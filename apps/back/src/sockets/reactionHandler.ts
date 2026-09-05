import type { Server } from 'socket.io';
import { WsEvents } from '@reagis/shared';
import Session from '../models/Session';
import { sessionRoom } from './rooms';
import type { SessionSocket } from './joinHandler';

type ReactionPayload = {
emoji?: string;
};

export const registerReactionHandler = (io: Server, socket: SessionSocket) => {
socket.on(WsEvents.SEND_REACTION, async (payload: ReactionPayload = {}) => {
const { sessionId } = socket.data;
if (!sessionId) return;

try {
const session = await Session.findByIdAndUpdate(
sessionId,
{ $inc: { reactionCount: 1 } },
{ new: true }
);

if (!session) return;

io.to(sessionRoom(sessionId)).emit(WsEvents.REACTION_UPDATE, {
sessionId,
reactionCount: session.reactionCount,
emoji: payload.emoji || session.reaction || '👍',
});
} catch (err) {
console.error('[ws] send_reaction', err);
}
});
};