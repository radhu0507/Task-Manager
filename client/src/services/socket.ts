import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface RealtimeEvent {
  event: string;
  payload: unknown;
}

type Listener = (payload: RealtimeEvent) => void;

let listeners: Listener[] = [];

export function connectSocket(token: string | undefined) {
  if (socket) return socket;
  socket = io('/', {
    auth: { token },
    withCredentials: true,
  });

  socket.on('connect_error', () => {
    socket = null;
  });

  const events = ['task:updated', 'task:deleted', 'comment:added', 'attachment:added', 'notification'];
  events.forEach(evt => {
    socket!.on(evt, (payload) => {
      listeners.forEach(l => l({ event: evt, payload }));
    });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
  listeners = [];
}

export function subscribeRealtime(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function joinTaskRoom(taskId: string) {
  socket?.emit('task:join', taskId);
}

export function leaveTaskRoom(taskId: string) {
  socket?.emit('task:leave', taskId);
}

export function getSocket() {
  return socket;
}