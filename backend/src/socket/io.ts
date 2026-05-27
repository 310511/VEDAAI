import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join-assignment", (assignmentId: string) => {
      if (assignmentId) {
        socket.join(`assignment:${assignmentId}`);
      }
    });

    socket.on("leave-assignment", (assignmentId: string) => {
      if (assignmentId) {
        socket.leave(`assignment:${assignmentId}`);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToAssignment(
  assignmentId: string,
  event: string,
  data: unknown
): void {
  if (io) {
    io.to(`assignment:${assignmentId}`).emit(event, data);
  }
}
