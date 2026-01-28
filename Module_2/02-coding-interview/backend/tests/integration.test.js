import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { io as ioClient } from 'socket.io-client';
import { createInterviewServer } from '../src/createInterviewServer.js';

function onceWithTimeout(socket, eventName, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for event "${eventName}"`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(t);
      resolve(payload);
    }

    socket.once(eventName, onEvent);
  });
}

describe('integration: REST + Socket.io', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = createInterviewServer({ frontendUrl: 'http://localhost:5173' });
    const { port } = await server.start(0);
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('POST /api/rooms creates a room with an 8-char id', async () => {
    const res = await request(server.app).post('/api/rooms').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('roomId');
    expect(res.body.roomId).toMatch(/^[a-z0-9]{8}$/i);
  });

  it('GET /api/rooms/:roomId returns room info and 404 for missing rooms', async () => {
    const createRes = await request(server.app).post('/api/rooms').send({});
    const { roomId } = createRes.body;

    const roomRes = await request(server.app).get(`/api/rooms/${roomId}`);
    expect(roomRes.status).toBe(200);
    expect(roomRes.body).toMatchObject({
      roomId,
      participantCount: 0,
      language: 'javascript',
    });

    const missingRes = await request(server.app).get('/api/rooms/doesnotexist');
    expect(missingRes.status).toBe(404);
  });

  it('joining a non-existent room emits an error', async () => {
    const s = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await onceWithTimeout(s, 'connect');

    s.emit('join-room', { roomId: 'badroom', username: 'X' });
    const err = await onceWithTimeout(s, 'error');
    expect(err).toMatchObject({ message: 'Room not found' });

    s.disconnect();
  });

  it('two clients in a room receive real-time code updates', async () => {
    const createRes = await request(server.app).post('/api/rooms').send({});
    const { roomId } = createRes.body;

    const a = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    const b = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([onceWithTimeout(a, 'connect'), onceWithTimeout(b, 'connect')]);

    a.emit('join-room', { roomId, username: 'A' });
    b.emit('join-room', { roomId, username: 'B' });

    // Each join gets an initial code-update
    const initA = await onceWithTimeout(a, 'code-update');
    const initB = await onceWithTimeout(b, 'code-update');
    expect(initA).toMatchObject({ code: '', language: 'javascript' });
    expect(initB).toMatchObject({ code: '', language: 'javascript' });

    const nextUpdate = onceWithTimeout(b, 'code-update');
    a.emit('code-change', { roomId, code: 'console.log("hi")' });

    const updateB = await nextUpdate;
    expect(updateB).toMatchObject({ code: 'console.log("hi")', language: 'javascript' });

    a.disconnect();
    b.disconnect();
  });

  it('language-change broadcasts to all users in the room', async () => {
    const createRes = await request(server.app).post('/api/rooms').send({});
    const { roomId } = createRes.body;

    const a = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    const b = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([onceWithTimeout(a, 'connect'), onceWithTimeout(b, 'connect')]);

    a.emit('join-room', { roomId, username: 'A' });
    b.emit('join-room', { roomId, username: 'B' });
    await Promise.all([onceWithTimeout(a, 'code-update'), onceWithTimeout(b, 'code-update')]);

    const gotA = onceWithTimeout(a, 'language-update');
    const gotB = onceWithTimeout(b, 'language-update');
    a.emit('language-change', { roomId, language: 'python' });

    await expect(gotA).resolves.toMatchObject({ language: 'python' });
    await expect(gotB).resolves.toMatchObject({ language: 'python' });

    a.disconnect();
    b.disconnect();
  });
});

