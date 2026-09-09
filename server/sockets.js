// Gerenciamento de conexões e eventos WebSockets em tempo real (Socket.IO)

let ioInstance = null;
const onlineUsers = new Map(); // socketId -> { userId, userName, userColor, boardId }

export function setupSockets(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // 1. Usuário entra no sistema / informa sua identidade
    socket.on('user:join', (userData) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId || 'guest',
        userName: userData.userName || 'Visitante',
        userColor: userData.userColor || '#3b82f6',
        boardId: userData.boardId || 'board-default',
        connectedAt: new Date().toISOString(),
      });

      broadcastOnlineUsers();
    });

    // 2. Mudança de quadro pelo usuário
    socket.on('user:switch_board', (boardId) => {
      const current = onlineUsers.get(socket.id);
      if (current) {
        current.boardId = boardId;
        onlineUsers.set(socket.id, current);
        broadcastOnlineUsers();
      }
    });

    // 3. Usuário desconecta
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      broadcastOnlineUsers();
    });
  });
}

// Transmitir lista de usuários online para todos os computadores
function broadcastOnlineUsers() {
  if (!ioInstance) return;
  const users = Array.from(onlineUsers.values());
  // Remover duplicados por ID de usuário para exibição amigável
  const uniqueUsers = [];
  const seen = new Set();
  for (const u of users) {
    if (!seen.has(u.userName)) {
      seen.add(u.userName);
      uniqueUsers.push(u);
    }
  }
  ioInstance.emit('users:online', uniqueUsers);
}

// Funções de broadcast para serem chamadas pelas rotas da API
export function broadcastEvent(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}
