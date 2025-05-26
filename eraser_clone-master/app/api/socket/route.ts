import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const encoder = new TextEncoder();
const rooms = new Map<string, Set<string>>();
const clients = new Map<string, ReadableStreamDefaultController>();

export const runtime = 'edge';

export async function GET(request: Request) {
  const room = new URL(request.url).searchParams.get('room');
  const username = new URL(request.url).searchParams.get('username');

  if (!room || !username) {
    return new NextResponse('Room and username are required', { status: 400 });
  }

  // Create SSE connection
  const stream = new ReadableStream({
    start(controller) {
      // Store client controller
      const clientId = Math.random().toString(36).slice(2);
      clients.set(clientId, controller);

      // Add client to room
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room)?.add(clientId);

      // Send join message to room
      broadcastToRoom(room, {
        type: 'user-joined',
        data: {
          username,
          timestamp: new Date().toISOString(),
        },
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(clientId);
        rooms.get(room)?.delete(clientId);
        if (rooms.get(room)?.size === 0) {
          rooms.delete(room);
        } else {
          broadcastToRoom(room, {
            type: 'user-left',
            data: {
              username,
              timestamp: new Date().toISOString(),
            },
          });
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const { room, type, data } = await request.json();

  if (!room || !type || !data) {
    return new NextResponse('Invalid message format', { status: 400 });
  }

  broadcastToRoom(room, {
    type,
    data: {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    },
  });

  return new NextResponse('Message sent', { status: 200 });
}

function broadcastToRoom(room: string, message: any) {
  const roomClients = rooms.get(room);
  if (!roomClients) return;

  const encoded = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
  
  roomClients.forEach(clientId => {
    const controller = clients.get(clientId);
    try {
      controller?.enqueue(encoded);
    } catch (err) {
      console.error('Error sending message to client:', err);
    }
  });
}

if (!global.wss) {
  global.wss = new WebSocketServer({ noServer: true });

  global.wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    sockets.set(id, ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(id, message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      const userRooms = Array.from(rooms.entries())
        .filter(([_, users]) => users.has(id))
        .map(([room]) => room);

      userRooms.forEach(room => {
        const users = rooms.get(room);
        users.delete(id);
        if (users.size === 0) {
          rooms.delete(room);
        } else {
          broadcastToRoom(room, {
            type: 'user-left',
            data: {
              username: sockets.get(id)?.username || 'Unknown',
              timestamp: new Date().toISOString(),
            },
          });
        }
      });

      sockets.delete(id);
    });
  });
}

function handleMessage(senderId: string, message: any) {
  const { type, roomId, data } = message;

  switch (type) {
    case 'join-room':
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(senderId);
      sockets.get(senderId).username = data.username;
      broadcastToRoom(roomId, {
        type: 'user-joined',
        data: {
          username: data.username,
          timestamp: new Date().toISOString(),
        },
      });
      break;

    case 'send-message':
      broadcastToRoom(roomId, {
        type: 'new-message',
        data: {
          ...data,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        },
      });
      break;
  }
}

function broadcastToRoom(roomId: string, message: any) {
  const users = rooms.get(roomId);
  if (!users) return;

  users.forEach(userId => {
    const socket = sockets.get(userId);
    if (socket?.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId: string, username: string) => {
    console.log(`${username} joining room ${roomId}`);
    socket.join(roomId);
    io.to(roomId).emit('user-joined', {
      username,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('leave-room', (roomId: string, username: string) => {
    console.log(`${username} leaving room ${roomId}`);
    socket.leave(roomId);
    io.to(roomId).emit('user-left', {
      username,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('send-message', (roomId: string, message: { sender: string; content: string }) => {
    console.log(`New message in room ${roomId}:`, message);
    io.to(roomId).emit('new-message', {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const port = parseInt(process.env.SOCKET_PORT || '3001', 10);
httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});

export async function GET(req: Request) {
  return new Response('Socket.IO server is running', { status: 200 });
}

  (res.socket.server as any).io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId: string, username: string) => {
      console.log(`${username} joining room ${roomId}`);
      socket.join(roomId);
      io.to(roomId).emit('user-joined', {
        username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave-room', (roomId: string, username: string) => {
      console.log(`${username} leaving room ${roomId}`);
      socket.leave(roomId);
      io.to(roomId).emit('user-left', {
        username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('send-message', (roomId: string, message: { sender: string; content: string }) => {
      console.log(`New message in room ${roomId}:`, message);
      io.to(roomId).emit('new-message', {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return new Response('Socket is initialized', { status: 200 });
}