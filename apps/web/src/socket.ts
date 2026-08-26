import { io, type Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export const socket: Socket = io(WS_URL, { autoConnect: false });
