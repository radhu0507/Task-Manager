import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

let io: Server | null = null;

export function initRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const tokenFromAuth = socket.handshake.auth?.token as string | undefined;
    const cookies = socket.handshake.headers.cookie || '';
    const match = cookies.match(/(?:^|;\s*)token=([^;]+)/);
    const token = tokenFromAuth || match?.[1];
    if (!token) return next(new Error('authentication required'));
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('task:join', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });
  });

  return io;
}

export function getIo(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToTask(taskId: string, event: string, payload: unknown) {
  io?.to(`task:${taskId}`).emit(event, payload);
}