import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

function removeParticipantFromRoom({ io, socket, rooms, roomId }) {
  const room = rooms.get(roomId);
  if (!room) return;

  const index = room.participants.findIndex((p) => p.id === socket.id);
  if (index === -1) return;

  room.participants.splice(index, 1);

  socket.to(roomId).emit('user-left', {
    userId: socket.id,
    participantCount: room.participants.length,
  });

  io.to(roomId).emit('participants-update', {
    participants: room.participants,
    count: room.participants.length,
  });

  // Clean up empty rooms after 5 minutes
  if (room.participants.length === 0) {
    setTimeout(() => {
      if (rooms.get(roomId)?.participants.length === 0) {
        rooms.delete(roomId);
      }
    }, 5 * 60 * 1000);
  }
}

export function createInterviewServer({ frontendUrl = 'http://localhost:5173' } = {}) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors());
  app.use(express.json());

  // Store active rooms and their code
  const rooms = new Map();

  // Generate a unique room ID
  app.post('/api/rooms', (req, res) => {
    const roomId = uuidv4().substring(0, 8);
    rooms.set(roomId, {
      code: '',
      language: 'javascript',
      participants: [],
    });
    res.json({ roomId });
  });

  // Get room info
  app.get('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
      roomId,
      participantCount: room.participants.length,
      language: room.language,
    });
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, username }) => {
      if (!rooms.has(roomId)) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      const room = rooms.get(roomId);

      // Add participant
      if (!room.participants.find((p) => p.id === socket.id)) {
        room.participants.push({ id: socket.id, username: username || 'Anonymous' });
      }

      // Send current code to the new participant
      socket.emit('code-update', {
        code: room.code,
        language: room.language,
      });

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: username || 'Anonymous',
        participantCount: room.participants.length,
      });

      // Send updated participant list
      io.to(roomId).emit('participants-update', {
        participants: room.participants,
        count: room.participants.length,
      });
    });

    socket.on('leave-room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      removeParticipantFromRoom({ io, socket, rooms, roomId });
    });

    socket.on('code-change', ({ roomId, code, language }) => {
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.code = code;
      if (language) room.language = language;

      // Broadcast to all other users in the room
      socket.to(roomId).emit('code-update', {
        code,
        language: room.language,
      });
    });

    socket.on('language-change', ({ roomId, language }) => {
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.language = language;

      // Broadcast to all users in the room
      io.to(roomId).emit('language-update', { language });
    });

    socket.on('disconnect', () => {
      // Remove participant from all rooms
      rooms.forEach((room, roomId) => {
        if (room.participants.some((p) => p.id === socket.id)) {
          removeParticipantFromRoom({ io, socket, rooms, roomId });
        }
      });
    });
  });

  async function start(port = 0) {
    return await new Promise((resolve, reject) => {
      httpServer.listen(port, () => {
        const address = httpServer.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        resolve({ port: actualPort });
      });
      httpServer.on('error', reject);
    });
  }

  async function stop() {
    await new Promise((resolve) => io.close(resolve));

    // httpServer.close() can error if already closed; make shutdown idempotent for tests.
    await new Promise((resolve, reject) => {
      try {
        httpServer.close((err) => {
          if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') return reject(err);
          resolve();
        });
      } catch (err) {
        if (err?.code === 'ERR_SERVER_NOT_RUNNING') return resolve();
        reject(err);
      }
    });
  }

  return { app, httpServer, io, rooms, start, stop };
}

