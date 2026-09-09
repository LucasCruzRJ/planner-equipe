import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { BoardView } from './components/BoardView';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { TaskModal } from './components/TaskModal';
import { NewTaskModal } from './components/NewTaskModal';
import { UserProfileModal } from './components/UserProfileModal';
import { NewBoardModal } from './components/NewBoardModal';
import { ShareModal } from './components/ShareModal';
import { NotificationToast } from './components/NotificationToast';
import { usePlannerSocket } from './hooks/usePlannerSocket';
import { formatDueDate } from './utils/helpers';

export function App() {
  // Estado de Dados
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do Usuário Atual (armazenado em localStorage para persistência por computador)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('planner_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Visualização Ativa: 'board' | 'list' | 'calendar' | 'dashboard'
  const [activeView, setActiveView] = useState('board');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Modais
  const [activeTask, setActiveTask] = useState(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState(null);
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Hook de WebSockets para Sincronização em Tempo Real
  const { connected, onlineUsers, notifications, registerCallbacks } = usePlannerSocket(
    activeBoard?.id,
    currentUser
  );

  // 1. Carregar lista de usuários e quadros iniciais
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [usersRes, boardsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/boards'),
        ]);

        const usersData = await usersRes.json();
        const boardsData = await boardsRes.json();

        setUsers(usersData);
        setBoards(boardsData);

        // Se o usuário ainda não escolheu um perfil, definir o primeiro ou visitante
        if (!currentUser && usersData.length > 0) {
          const defaultUser = usersData[0];
          setCurrentUser(defaultUser);
          localStorage.setItem('planner_user', JSON.stringify(defaultUser));
        }

        // Definir primeiro quadro ativo
        if (boardsData.length > 0) {
          setActiveBoard(boardsData[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Carregar colunas e tarefas do quadro ativo
  const loadBoardData = useCallback(async (boardId) => {
    if (!boardId) return;
    try {
      const res = await fetch(`/api/boards/${boardId}/full`);
      if (res.ok) {
        const data = await res.json();
        setColumns(data.columns || []);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do quadro:', err);
    }
  }, []);

  useEffect(() => {
    if (activeBoard?.id) {
      loadBoardData(activeBoard.id);
    }
  }, [activeBoard?.id, loadBoardData]);

  // 3. Registrar Callbacks de Eventos de Tempo Real (Socket.IO)
  useEffect(() => {
    registerCallbacks({
      onTaskChange: (action, data) => {
        if (action === 'create') {
          setTasks((prev) => {
            if (prev.some((t) => t.id === data.id)) return prev;
            return [...prev, data];
          });
        } else if (action === 'update') {
          setTasks((prev) => prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)));
          setActiveTask((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev));
        } else if (action === 'move') {
          const { taskId, destColId, allDestTaskIds } = data;
          setTasks((prev) => {
            return prev.map((t) => {
              if (t.id === taskId) {
                return { ...t, column_id: destColId };
              }
              return t;
            });
          });
        } else if (action === 'delete') {
          setTasks((prev) => prev.filter((t) => t.id !== data.id));
          setActiveTask((prev) => (prev && prev.id === data.id ? null : prev));
        } else if (action === 'subtask_create') {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === data.task_id) {
                const subtasks = [...(t.subtasks || []), data.subtask];
                return { ...t, subtasks };
              }
              return t;
            })
          );
          setActiveTask((prev) => {
            if (prev && prev.id === data.task_id) {
              const subtasks = [...(prev.subtasks || []), data.subtask];
              return { ...prev, subtasks };
            }
            return prev;
          });
        } else if (action === 'subtask_update') {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === data.task_id) {
                const subtasks = (t.subtasks || []).map((st) =>
                  st.id === data.subtask.id ? data.subtask : st
                );
                return { ...t, subtasks };
              }
              return t;
            })
          );
          setActiveTask((prev) => {
            if (prev && prev.id === data.task_id) {
              const subtasks = (prev.subtasks || []).map((st) =>
                st.id === data.subtask.id ? data.subtask : st
              );
              return { ...prev, subtasks };
            }
            return prev;
          });
        } else if (action === 'subtask_delete') {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === data.task_id) {
                const subtasks = (t.subtasks || []).filter((st) => st.id !== data.subtaskId);
                return { ...t, subtasks };
              }
              return t;
            })
          );
          setActiveTask((prev) => {
            if (prev && prev.id === data.task_id) {
              const subtasks = (prev.subtasks || []).filter((st) => st.id !== data.subtaskId);
              return { ...prev, subtasks };
            }
            return prev;
          });
        } else if (action === 'comment_create') {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === data.task_id) {
                const comments = [...(t.comments || []), data.comment];
                return { ...t, comments };
              }
              return t;
            })
          );
          setActiveTask((prev) => {
            if (prev && prev.id === data.task_id) {
              const comments = [...(prev.comments || []), data.comment];
              return { ...prev, comments };
            }
            return prev;
          });
        }
      },
      onColumnChange: (action, data) => {
        if (action === 'create') {
          setColumns((prev) => [...prev, data]);
        } else if (action === 'update') {
          setColumns((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
        } else if (action === 'delete') {
          setColumns((prev) => prev.filter((c) => c.id !== data.id));
          setTasks((prev) => prev.filter((t) => t.column_id !== data.id));
        }
      },
      onBoardChange: (action, data) => {
        if (action === 'create') {
          setBoards((prev) => [...prev, data]);
        } else if (action === 'update') {
          setBoards((prev) => prev.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
          setActiveBoard((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev));
        }
      },
    });
  }, [registerCallbacks]);

  // Ações de Usuários
  const handleSelectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('planner_user', JSON.stringify(user));
  };

  const handleCreateUser = async (userData) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [...prev, newUser]);
        handleSelectUser(newUser);
      }
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
    }
  };

  // Ações de Quadros
  const handleCreateBoard = async (boardData) => {
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData),
      });
      if (res.ok) {
        const newBoard = await res.json();
        setBoards((prev) => [...prev, newBoard]);
        setActiveBoard(newBoard);
      }
    } catch (err) {
      console.error('Erro ao criar plano:', err);
    }
  };

  // Ações de Colunas
  const handleCreateColumn = async (title) => {
    if (!activeBoard?.id) return;
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: activeBoard.id, title }),
      });
      if (res.ok) {
        const newCol = await res.json();
        setColumns((prev) => {
          if (prev.some((c) => c.id === newCol.id)) return prev;
          return [...prev, newCol];
        });
      }
    } catch (err) {
      console.error('Erro ao criar coluna:', err);
    }
  };

  const handleUpdateColumn = async (columnId, fields) => {
    try {
      await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, ...fields } : c)));
    } catch (err) {
      console.error('Erro ao atualizar coluna:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await fetch(`/api/columns/${columnId}`, { method: 'DELETE' });
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setTasks((prev) => prev.filter((t) => t.column_id !== columnId));
    } catch (err) {
      console.error('Erro ao excluir coluna:', err);
    }
  };

  // Ações de Tarefas
  const handleCreateTask = async (taskData) => {
    try {
      const { initialSubtasks, ...rest } = taskData;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });

      if (res.ok) {
        const newTask = await res.json();
        
        // Criar subtarefas iniciais caso existam
        if (initialSubtasks && initialSubtasks.length > 0) {
          for (const stTitle of initialSubtasks) {
            await handleAddSubtask(newTask.id, stTitle);
          }
        }

        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [...prev, newTask];
        });
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
    }
  };

  const handleUpdateTask = async (taskId, fields) => {
    try {
      // Atualização otimista
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask((prev) => ({ ...prev, ...fields }));
      }

      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const handleReorderTasks = async ({ taskId, sourceColId, destColId, sourceIndex, destIndex, allDestTaskIds }) => {
    // Atualização otimista no estado local
    setTasks((prev) => {
      return prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, column_id: destColId };
        }
        return t;
      });
    });

    try {
      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          sourceColId,
          destColId,
          sourceIndex,
          destIndex,
          allDestTaskIds,
        }),
      });
    } catch (err) {
      console.error('Erro ao reordenar tarefas:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  // Subtarefas e Comentários
  const handleAddSubtask = async (taskId, title) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const subtask = await res.json();
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              const subtasks = [...(t.subtasks || []), subtask];
              return { ...t, subtasks };
            }
            return t;
          })
        );
        if (activeTask && activeTask.id === taskId) {
          setActiveTask((prev) => ({
            ...prev,
            subtasks: [...(prev.subtasks || []), subtask],
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar subtarefa:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      // Atualização otimista
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: completed ? 1 : 0 } : st
          ),
        }))
      );
      if (activeTask) {
        setActiveTask((prev) => ({
          ...prev,
          subtasks: (prev.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: completed ? 1 : 0 } : st
          ),
        }));
      }
    } catch (err) {
      console.error('Erro ao atualizar subtarefa:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId),
        }))
      );
      if (activeTask) {
        setActiveTask((prev) => ({
          ...prev,
          subtasks: (prev.subtasks || []).filter((st) => st.id !== subtaskId),
        }));
      }
    } catch (err) {
      console.error('Erro ao excluir subtarefa:', err);
    }
  };

  const handleAddComment = async (taskId, commentData) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });
      if (res.ok) {
        const comment = await res.json();
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, comments: [...(t.comments || []), comment] };
            }
            return t;
          })
        );
        if (activeTask && activeTask.id === taskId) {
          setActiveTask((prev) => ({
            ...prev,
            comments: [...(prev.comments || []), comment],
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
    }
  };

  const handleExportCsv = () => {
    if (!activeBoard?.id) return;
    window.open(`/api/export/${activeBoard.id}?format=csv`, '_blank');
  };

  // Extrair todas as tags disponíveis no quadro para o filtro
  const availableTags = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Filtragem de Tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Busca por Texto (título, descrição, autor)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = (t.title || '').toLowerCase().includes(query);
        const inDesc = (t.description || '').toLowerCase().includes(query);
        const inAuthor = (t.created_by || '').toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inAuthor) return false;
      }

      // 2. Filtro por Responsável
      if (selectedAssignee) {
        if (!(t.assignees || []).includes(selectedAssignee)) return false;
      }

      // 3. Filtro por Prioridade
      if (selectedPriority) {
        if (t.priority !== selectedPriority) return false;
      }

      // 4. Filtro por Tag
      if (selectedTag) {
        if (!(t.tags || []).includes(selectedTag)) return false;
      }

      // 5. Filtro: Apenas Minhas Tarefas
      if (onlyMyTasks && currentUser?.id) {
        if (!(t.assignees || []).includes(currentUser.id)) return false;
      }

      // 6. Filtro: Apenas Atrasadas
      if (onlyOverdue) {
        const due = formatDueDate(t.due_date);
        if (!due || due.status !== 'overdue') return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedAssignee,
    selectedPriority,
    selectedTag,
    onlyMyTasks,
    onlyOverdue,
    currentUser?.id,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAssignee('');
    setSelectedPriority('');
    setSelectedTag('');
    setOnlyOverdue(false);
    setOnlyMyTasks(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Barra de Navegação Principal */}
      <Navbar
        boards={boards}
        activeBoard={activeBoard}
        onSelectBoard={(b) => setActiveBoard(b)}
        onOpenNewBoard={() => setIsNewBoardOpen(true)}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        onlineUsers={onlineUsers}
        connected={connected}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onNewTask={() => {
          setNewTaskColumnId(columns[0]?.id);
          setNewTaskDueDate(null);
          setIsNewTaskOpen(true);
        }}
        onExportCsv={handleExportCsv}
      />

      {/* 2. Barra de Busca e Filtros */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        users={users}
        selectedAssignee={selectedAssignee}
        onSelectAssignee={setSelectedAssignee}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        availableTags={availableTags}
        onlyOverdue={onlyOverdue}
        onToggleOnlyOverdue={() => setOnlyOverdue(!onlyOverdue)}
        onlyMyTasks={onlyMyTasks}
        onToggleOnlyMyTasks={() => setOnlyMyTasks(!onlyMyTasks)}
        onClearFilters={handleClearFilters}
      />

      {/* 3. Área de Visualizações do Planner */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Carregando quadro colaborativo...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'board' && (
              <BoardView
                columns={columns}
                tasks={filteredTasks}
                users={users}
                onOpenTask={(task) => setActiveTask(task)}
                onNewTaskInColumn={(colId) => {
                  setNewTaskColumnId(colId);
                  setNewTaskDueDate(null);
                  setIsNewTaskOpen(true);
                }}
                onReorderTasks={handleReorderTasks}
                onCreateColumn={handleCreateColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            )}

            {activeView === 'list' && (
              <ListView
                tasks={filteredTasks}
                columns={columns}
                users={users}
                onOpenTask={(task) => setActiveTask(task)}
                onNewTask={() => {
                  setNewTaskColumnId(columns[0]?.id);
                  setNewTaskDueDate(null);
                  setIsNewTaskOpen(true);
                }}
                onUpdateTask={handleUpdateTask}
              />
            )}

            {activeView === 'calendar' && (
              <CalendarView
                tasks={filteredTasks}
                onOpenTask={(task) => setActiveTask(task)}
                onNewTaskWithDate={(dateStr) => {
                  setNewTaskColumnId(columns[0]?.id);
                  setNewTaskDueDate(dateStr);
                  setIsNewTaskOpen(true);
                }}
              />
            )}

            {activeView === 'dashboard' && (
              <DashboardView
                tasks={tasks}
                columns={columns}
                users={users}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Modais do Sistema */}
      {activeTask && (
        <TaskModal
          task={activeTask}
          columns={columns}
          users={users}
          currentUser={currentUser}
          onClose={() => setActiveTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onAddComment={handleAddComment}
        />
      )}

      {isNewTaskOpen && (
        <NewTaskModal
          columns={columns}
          users={users}
          currentUser={currentUser}
          boardId={activeBoard?.id}
          initialColumnId={newTaskColumnId}
          initialDueDate={newTaskDueDate}
          onClose={() => setIsNewTaskOpen(false)}
          onCreateTask={handleCreateTask}
        />
      )}

      {isProfileOpen && (
        <UserProfileModal
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onCreateUser={handleCreateUser}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isNewBoardOpen && (
        <NewBoardModal
          onClose={() => setIsNewBoardOpen(false)}
          onCreateBoard={handleCreateBoard}
        />
      )}

      {isShareOpen && (
        <ShareModal onClose={() => setIsShareOpen(false)} />
      )}

      {/* Notificações em Tempo Real */}
      <NotificationToast notifications={notifications} />
    </div>
  );
}

export default App;
