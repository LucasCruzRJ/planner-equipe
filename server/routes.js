import express from 'express';
import db from './database.js';
import { broadcastEvent } from './sockets.js';
import { getLocalIpAddresses } from './ipHelper.js';
import { getPublicTunnelUrl } from './tunnel.js';
import { hashPassword, verifyPassword, generateToken, getUserIdFromToken } from './auth.js';

const router = express.Router();

const generateId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;

// Middleware auxiliar para obter o usuário autenticado na requisição
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  const user = db.prepare('SELECT id, name, email, role, is_admin, avatar_color FROM users WHERE id = ?').get(userId);
  return user || null;
}

// Verifica se o usuário tem permissão para alterar ou mover uma tarefa
function canUserModifyTask(user, task) {
  if (!user) return false;
  // 1. Gestores / Administradores (Chefe) têm permissão total
  if (user.is_admin === 1 || user.role?.toLowerCase().includes('gestor') || user.role?.toLowerCase().includes('chefe')) {
    return true;
  }
  // 2. Criador da tarefa tem permissão total
  if (task.created_by_user_id && task.created_by_user_id === user.id) {
    return true;
  }
  if (!task.created_by_user_id && task.created_by === user.name) {
    return true;
  }
  // 3. Membros atribuídos na tarefa
  const assignees = Array.isArray(task.assignees) ? task.assignees : JSON.parse(task.assignees || '[]');
  if (assignees.includes(user.id)) {
    return true;
  }
  return false;
}

// ==========================================
// 1. AUTENTICAÇÃO E CONTROLE DE ACESSO
// ==========================================

// Login com E-mail ou Seleção de Usuário + Senha/PIN
router.post('/auth/login', (req, res) => {
  try {
    const { email, userId, password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    let user = null;
    if (userId) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else if (email) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Se o usuário não tem senha cadastrada, aceita '1234' e salva o hash
    let isValid = false;
    if (!user.password_hash) {
      if (password === '1234') {
        const { hash, salt } = hashPassword(password);
        db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, user.id);
        isValid = true;
      }
    } else {
      isValid = verifyPassword(password, user.password_hash, user.password_salt);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Senha incorreta. Tente novamente ou use a senha padrão (1234).' });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
      avatar_color: user.avatar_color,
    };

    res.json({
      token,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cadastro de Novo Membro com Senha
router.post('/auth/register', (req, res) => {
  try {
    const { name, email, role, password, avatar_color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!password || password.length < 3) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 3 dígitos' });
    }

    const cleanEmail = (email || `${name.toLowerCase().replace(/\s+/g, '.')}@empresa.local`).trim();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário com este e-mail' });
    }

    const id = generateId('u');
    const { hash, salt } = hashPassword(password);
    const color = avatar_color || '#3b82f6';
    const userRole = role || 'Membro da Equipe';
    const isAdmin = userRole.toLowerCase().includes('gestor') || userRole.toLowerCase().includes('chefe') ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, name, email, role, is_admin, password_hash, password_salt, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), cleanEmail, userRole, isAdmin, hash, salt, color);

    const newUser = db.prepare('SELECT id, name, email, role, is_admin, avatar_color FROM users WHERE id = ?').get(id);
    const token = generateToken(newUser);

    broadcastEvent('user:created', newUser);

    res.status(201).json({
      token,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter Usuário Atual pelo Token
router.get('/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
  res.json({ user });
});

// ==========================================
// 2. INFORMAÇÕES DE REDE
// ==========================================
router.get('/network-info', (req, res) => {
  const ips = getLocalIpAddresses();
  const publicUrl = getPublicTunnelUrl();
  res.json({
    port: process.env.PORT || 3000,
    localIps: ips,
    publicUrl: publicUrl || null,
  });
});

// ==========================================
// 3. MEMBROS DA EQUIPE (USERS)
// ==========================================
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, is_admin, avatar_color, created_at FROM users ORDER BY is_admin DESC, name ASC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. QUADROS / PLANOS (BOARDS)
// ==========================================
router.get('/boards', (req, res) => {
  try {
    const boards = db.prepare('SELECT * FROM boards ORDER BY created_at ASC').all();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/boards', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { title, description, color, icon } = req.body;
    if (!title) return res.status(400).json({ error: 'Título do plano é obrigatório' });

    const id = generateId('board');
    db.prepare(`
      INSERT INTO boards (id, title, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, description || '', color || '#3b82f6', icon || 'layout-grid');

    const defaultCols = [
      ['col-' + generateId(), id, '📋 A Fazer', 0, '#f59e0b'],
      ['col-' + generateId(), id, '⚡ Em Andamento', 1, '#3b82f6'],
      ['col-' + generateId(), id, '✅ Concluído', 2, '#10b981'],
    ];

    const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)');
    for (const col of defaultCols) {
      insertCol.run(...col);
    }

    const newBoard = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
    broadcastEvent('board:created', newBoard);
    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. ESTRUTURA COMPLETA DO QUADRO
// ==========================================
router.get('/boards/:id/full', (req, res) => {
  try {
    const { id } = req.params;
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
    if (!board) return res.status(404).json({ error: 'Quadro não encontrado' });

    const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(id);
    const rawTasks = db.prepare('SELECT * FROM tasks WHERE board_id = ? ORDER BY position ASC').all(id);

    const taskIds = rawTasks.map((t) => t.id);
    let subtasks = [];
    let comments = [];

    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = db.prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY position ASC`).all(...taskIds);
      comments = db.prepare(`SELECT * FROM comments WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`).all(...taskIds);
    }

    const subtasksByTask = {};
    for (const st of subtasks) {
      if (!subtasksByTask[st.task_id]) subtasksByTask[st.task_id] = [];
      subtasksByTask[st.task_id].push(st);
    }

    const commentsByTask = {};
    for (const c of comments) {
      if (!commentsByTask[c.task_id]) commentsByTask[c.task_id] = [];
      commentsByTask[c.task_id].push(c);
    }

    const tasks = rawTasks.map((t) => ({
      ...t,
      tags: JSON.parse(t.tags || '[]'),
      assignees: JSON.parse(t.assignees || '[]'),
      subtasks: subtasksByTask[t.id] || [],
      comments: commentsByTask[t.id] || [],
    }));

    res.json({
      board,
      columns,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. COLUNAS / BUCKETS
// ==========================================
router.post('/columns', (req, res) => {
  try {
    const { board_id, title, color } = req.body;
    if (!board_id || !title) return res.status(400).json({ error: 'Board ID e título são obrigatórios' });

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM columns WHERE board_id = ?').get(board_id).maxPos;
    const id = generateId('col');

    db.prepare(`
      INSERT INTO columns (id, board_id, title, position, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, board_id, title, maxPos + 1, color || '#64748b');

    const newCol = db.prepare('SELECT * FROM columns WHERE id = ?').get(id);
    broadcastEvent('column:created', newCol);
    res.status(201).json(newCol);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, color, position } = req.body;

    db.prepare(`
      UPDATE columns
      SET title = COALESCE(?, title),
          color = COALESCE(?, color),
          position = COALESCE(?, position)
      WHERE id = ?
    `).run(title, color, position, id);

    const updated = db.prepare('SELECT * FROM columns WHERE id = ?').get(id);
    broadcastEvent('column:updated', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(id);
    if (!col) return res.status(404).json({ error: 'Coluna não encontrada' });

    db.prepare('DELETE FROM columns WHERE id = ?').run(id);
    broadcastEvent('column:deleted', { id, board_id: col.board_id });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. TAREFAS COM CONTROLE DE PERMISSÃO
// ==========================================
router.post('/tasks', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const {
      board_id,
      column_id,
      title,
      description,
      priority,
      start_date,
      due_date,
      tags,
      assignees,
      created_by,
      color,
    } = req.body;

    if (!board_id || !column_id || !title) {
      return res.status(400).json({ error: 'Quadro, Coluna e Título são obrigatórios' });
    }

    const creatorName = authUser?.name || created_by || 'Membro da Equipe';
    const creatorId = authUser?.id || null;

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM tasks WHERE column_id = ?').get(column_id).maxPos;
    const id = generateId('task');

    db.prepare(`
      INSERT INTO tasks (
        id, board_id, column_id, title, description, priority,
        start_date, due_date, position, tags, assignees, created_by, created_by_user_id, color
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      board_id,
      column_id,
      title,
      description || '',
      priority || 'media',
      start_date || null,
      due_date || null,
      maxPos + 1,
      JSON.stringify(tags || []),
      JSON.stringify(assignees || []),
      creatorName,
      creatorId,
      color || null
    );

    const taskRaw = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const task = {
      ...taskRaw,
      tags: JSON.parse(taskRaw.tags || '[]'),
      assignees: JSON.parse(taskRaw.assignees || '[]'),
      subtasks: [],
      comments: [],
    };

    broadcastEvent('task:created', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const authUser = getAuthUser(req);
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Tarefa não encontrada' });

    // VERIFICAÇÃO DE PERMISSÃO:
    // Apenas Administrador/Gestor, Criador da tarefa ou Responsável atribuído podem editar
    if (authUser && !canUserModifyTask(authUser, current)) {
      return res.status(403).json({
        error: `Você não tem permissão para alterar esta tarefa. Ela pertence a ${current.created_by || 'outro membro da equipe'}.`,
      });
    }

    const {
      title,
      description,
      priority,
      start_date,
      due_date,
      column_id,
      position,
      tags,
      assignees,
      color,
    } = req.body;

    db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          start_date = ?,
          due_date = ?,
          column_id = COALESCE(?, column_id),
          position = COALESCE(?, position),
          tags = COALESCE(?, tags),
          assignees = COALESCE(?, assignees),
          color = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title : current.title,
      description !== undefined ? description : current.description,
      priority !== undefined ? priority : current.priority,
      start_date !== undefined ? start_date : current.start_date,
      due_date !== undefined ? due_date : current.due_date,
      column_id !== undefined ? column_id : current.column_id,
      position !== undefined ? position : current.position,
      tags !== undefined ? JSON.stringify(tags) : current.tags,
      assignees !== undefined ? JSON.stringify(assignees) : current.assignees,
      color !== undefined ? color : current.color,
      id
    );

    const updatedRaw = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC').all(id);
    const comments = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC').all(id);

    const task = {
      ...updatedRaw,
      tags: JSON.parse(updatedRaw.tags || '[]'),
      assignees: JSON.parse(updatedRaw.assignees || '[]'),
      subtasks,
      comments,
    };

    broadcastEvent('task:updated', task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reordenação / Movimentação no Quadro com checagem de permissão
router.post('/tasks/reorder', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const { taskId, sourceColId, destColId, sourceIndex, destIndex, allDestTaskIds } = req.body;

    if (!taskId || !destColId) {
      return res.status(400).json({ error: 'Parâmetros de reordenação incompletos' });
    }

    const currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!currentTask) return res.status(404).json({ error: 'Tarefa não encontrada' });

    // Se estiver mudando de coluna (mudança de status), checa se o usuário tem permissão
    if (sourceColId !== destColId && authUser && !canUserModifyTask(authUser, currentTask)) {
      return res.status(403).json({
        error: `Você não pode mover esta tarefa. Ela pertence a ${currentTask.created_by || 'outro membro'}.`,
      });
    }

    const updateStmt = db.prepare('UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    const reorderTx = db.transaction(() => {
      if (allDestTaskIds && Array.isArray(allDestTaskIds)) {
        allDestTaskIds.forEach((tId, idx) => {
          updateStmt.run(destColId, idx, tId);
        });
      } else {
        updateStmt.run(destColId, destIndex, taskId);
      }
    });

    reorderTx();

    broadcastEvent('task:moved', {
      taskId,
      sourceColId,
      destColId,
      sourceIndex,
      destIndex,
      allDestTaskIds,
      board_id: currentTask.board_id,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exclusão de Tarefa (Apenas Gestor ou Criador)
router.delete('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const authUser = getAuthUser(req);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    if (authUser) {
      const isCreator = (task.created_by_user_id && task.created_by_user_id === authUser.id) || task.created_by === authUser.name;
      const isAdmin = authUser.is_admin === 1 || authUser.role?.toLowerCase().includes('gestor') || authUser.role?.toLowerCase().includes('chefe');
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          error: `Apenas ${task.created_by || 'o criador'} ou o Gestor podem excluir esta tarefa.`,
        });
      }
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    broadcastEvent('task:deleted', { id, board_id: task.board_id, column_id: task.column_id });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. SUBTAREFAS / CHECKLIST
// ==========================================
router.post('/tasks/:id/subtasks', (req, res) => {
  try {
    const { id: task_id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Título do item é obrigatório' });

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM subtasks WHERE task_id = ?').get(task_id).maxPos;
    const subtaskId = generateId('st');

    db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position)
      VALUES (?, ?, ?, 0, ?)
    `).run(subtaskId, task_id, title, maxPos + 1);

    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    const task = db.prepare('SELECT board_id FROM tasks WHERE id = ?').get(task_id);

    broadcastEvent('subtask:created', { task_id, subtask, board_id: task?.board_id });
    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/subtasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const current = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Subtarefa não encontrada' });

    db.prepare(`
      UPDATE subtasks
      SET title = COALESCE(?, title),
          completed = COALESCE(?, completed)
      WHERE id = ?
    `).run(title, completed !== undefined ? (completed ? 1 : 0) : current.completed, id);

    const updated = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
    const task = db.prepare('SELECT board_id FROM tasks WHERE id = ?').get(updated.task_id);

    broadcastEvent('subtask:updated', { task_id: updated.task_id, subtask: updated, board_id: task?.board_id });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subtasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
    if (!subtask) return res.status(404).json({ error: 'Subtarefa não encontrada' });

    db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
    const task = db.prepare('SELECT board_id FROM tasks WHERE id = ?').get(subtask.task_id);

    broadcastEvent('subtask:deleted', { task_id: subtask.task_id, subtaskId: id, board_id: task?.board_id });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. COMENTÁRIOS AUTENTICADOS EM TEMPO REAL
// ==========================================
router.post('/tasks/:id/comments', (req, res) => {
  try {
    const { id: task_id } = req.params;
    const authUser = getAuthUser(req);
    const { content, author_name, author_avatar } = req.body;

    if (!content) return res.status(400).json({ error: 'Mensagem do comentário é obrigatória' });

    const commentId = generateId('comm');
    const finalAuthor = authUser?.name || author_name || 'Colega';
    const finalAvatar = authUser?.avatar_color || author_avatar || '#3b82f6';
    const finalAuthorId = authUser?.id || null;

    db.prepare(`
      INSERT INTO comments (id, task_id, author_name, author_id, author_avatar, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      commentId,
      task_id,
      finalAuthor,
      finalAuthorId,
      finalAvatar,
      content
    );

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    const task = db.prepare('SELECT board_id FROM tasks WHERE id = ?').get(task_id);

    broadcastEvent('comment:created', { task_id, comment, board_id: task?.board_id });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. EXPORTAÇÃO EXCEL / CSV
// ==========================================
router.get('/export/:boardId', (req, res) => {
  try {
    const { boardId } = req.params;
    const { format } = req.query;

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
    const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(boardId);
    const tasks = db.prepare('SELECT * FROM tasks WHERE board_id = ? ORDER BY position ASC').all(boardId);
    const users = db.prepare('SELECT id, name FROM users').all();
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
    const colMap = Object.fromEntries(columns.map((c) => [c.id, c.title]));

    if (format === 'csv') {
      let csv = 'ID,Titulo,Descricao,Coluna,Prioridade,Data_Inicio,Data_Entrega,Responsaveis,Criado_Por\n';
      for (const t of tasks) {
        const assignees = JSON.parse(t.assignees || '[]').map((uid) => userMap[uid] || uid).join('; ');
        const row = [
          `"${t.id}"`,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${colMap[t.column_id] || ''}"`,
          `"${t.priority}"`,
          `"${t.start_date || ''}"`,
          `"${t.due_date || ''}"`,
          `"${assignees}"`,
          `"${t.created_by || ''}"`
        ].join(',');
        csv += row + '\n';
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=planner_tarefas_${Date.now()}.csv`);
      return res.send('\uFEFF' + csv);
    }

    res.json({
      board,
      columns,
      tasks: tasks.map((t) => ({
        ...t,
        tags: JSON.parse(t.tags || '[]'),
        assignees: JSON.parse(t.assignees || '[]'),
      })),
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
