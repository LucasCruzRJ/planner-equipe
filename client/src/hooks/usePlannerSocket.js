import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function usePlannerSocket(activeBoardId, currentUser) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  // Callbacks de atualização de dados
  const onTaskChangeRef = useRef(null);
  const onColumnChangeRef = useRef(null);
  const onBoardChangeRef = useRef(null);

  const registerCallbacks = useCallback(({ onTaskChange, onColumnChange, onBoardChange }) => {
    onTaskChangeRef.current = onTaskChange;
    onColumnChangeRef.current = onColumnChange;
    onBoardChangeRef.current = onBoardChange;
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    // Conectar ao mesmo host e porta de onde a página está sendo servida
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (currentUser) {
        socket.emit('user:join', {
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.avatar_color,
          boardId: activeBoardId,
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    // Eventos de Tarefas
    socket.on('task:created', (task) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('create', task);
      }
      addNotification(`Nova tarefa criada: "${task.title}"`, 'success');
    });

    socket.on('task:updated', (task) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('update', task);
      }
    });

    socket.on('task:moved', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('move', data);
      }
    });

    socket.on('task:deleted', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('delete', data);
      }
      addNotification(`Tarefa removida do quadro.`, 'warning');
    });

    // Eventos de Checklist
    socket.on('subtask:created', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('subtask_create', data);
      }
    });

    socket.on('subtask:updated', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('subtask_update', data);
      }
    });

    socket.on('subtask:deleted', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('subtask_delete', data);
      }
    });

    // Eventos de Comentários
    socket.on('comment:created', (data) => {
      if (onTaskChangeRef.current) {
        onTaskChangeRef.current('comment_create', data);
      }
      addNotification(`${data.comment.author_name} comentou em uma tarefa.`, 'info');
    });

    // Eventos de Colunas
    socket.on('column:created', (col) => {
      if (onColumnChangeRef.current) {
        onColumnChangeRef.current('create', col);
      }
    });

    socket.on('column:updated', (col) => {
      if (onColumnChangeRef.current) {
        onColumnChangeRef.current('update', col);
      }
    });

    socket.on('column:deleted', (data) => {
      if (onColumnChangeRef.current) {
        onColumnChangeRef.current('delete', data);
      }
    });

    // Eventos de Quadros
    socket.on('board:created', (board) => {
      if (onBoardChangeRef.current) {
        onBoardChangeRef.current('create', board);
      }
      addNotification(`Novo plano criado: "${board.title}"`, 'info');
    });

    socket.on('board:updated', (board) => {
      if (onBoardChangeRef.current) {
        onBoardChangeRef.current('update', board);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);

  // Atualizar identidade quando o usuário ou quadro mudar
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && currentUser) {
      socketRef.current.emit('user:join', {
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.avatar_color,
        boardId: activeBoardId,
      });
    }
  }, [currentUser, activeBoardId]);

  return {
    connected,
    onlineUsers,
    notifications,
    registerCallbacks,
    socket: socketRef.current,
  };
}
