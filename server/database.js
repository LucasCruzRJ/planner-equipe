import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'planner.db');
const db = new Database(dbPath);

// Habilitar Foreign Keys e WAL mode para alta performance e concorrência
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Tabela de Usuários / Membros da Equipe com Autenticação e Cargos
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'Membro',
      is_admin INTEGER DEFAULT 0,
      password_hash TEXT,
      password_salt TEXT,
      avatar_color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações seguras caso a tabela já existisse
  try {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN password_salt TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;');
  } catch {}

  // 2. Tabela de Quadros / Planos (Boards)
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT 'layout-grid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Tabela de Colunas / Buckets
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#64748b',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );
  `);

  // 4. Tabela de Tarefas (Tasks) com ID do Criador
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      column_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
      start_date TEXT,
      due_date TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      tags TEXT DEFAULT '[]', -- JSON array de tags
      assignees TEXT DEFAULT '[]', -- JSON array de IDs de usuários
      created_by TEXT,
      created_by_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec('ALTER TABLE tasks ADD COLUMN created_by_user_id TEXT;');
  } catch {}

  // 5. Tabela de Subtarefas / Checklist
  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // 6. Tabela de Comentários
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_id TEXT,
      author_avatar TEXT DEFAULT '#3b82f6',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec('ALTER TABLE comments ADD COLUMN author_id TEXT;');
  } catch {}

  // Limpeza de usuários e tarefas de teste legados a pedido do usuário
  try {
    db.exec(`
      DELETE FROM subtasks WHERE task_id IN ('task-1', 'task-2', 'task-3', 'task-4', 'task-5');
      DELETE FROM comments WHERE task_id IN ('task-1', 'task-2', 'task-3', 'task-4', 'task-5') OR author_id IN ('u-1', 'u-2', 'u-3', 'u-4', 'u-5');
      DELETE FROM tasks WHERE id IN ('task-1', 'task-2', 'task-3', 'task-4', 'task-5');
      DELETE FROM users WHERE id IN ('u-1', 'u-2', 'u-3', 'u-4', 'u-5');
    `);
  } catch {}

  // 7. Tabela de Histórico / Log de Atividades
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      task_id TEXT,
      user_name TEXT NOT NULL,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed / Atualização de dados padrão (sem dados fictícios)
  seedDefaultData();
}

function seedDefaultData() {
  // Não criamos usuários default: a equipe cadastra seus próprios membros reais.
  const boardCount = db.prepare('SELECT count(*) as count FROM boards').get().count;
  if (boardCount === 0) {
    const boardId = 'board-default';
    db.prepare(`
      INSERT INTO boards (id, title, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      boardId,
      'Planejamento Geral da Equipe',
      'Quadro colaborativo para acompanhamento de projetos, entregas e tarefas da equipe em tempo real.',
      '#3b82f6',
      'kanban'
    );

    const defaultColumns = [
      ['col-1', boardId, '📋 Backlog / Ideias', 0, '#64748b'],
      ['col-2', boardId, '🚀 A Fazer', 1, '#f59e0b'],
      ['col-3', boardId, '⚡ Em Andamento', 2, '#3b82f6'],
      ['col-4', boardId, '🔍 Em Revisão / Testes', 3, '#a855f7'],
      ['col-5', boardId, '✅ Concluído', 4, '#10b981'],
    ];

    const insertCol = db.prepare(`
      INSERT INTO columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)
    `);

    for (const col of defaultColumns) {
      insertCol.run(...col);
    }
    // Nenhuma tarefa fictícia é criada. O quadro começa limpo para a equipe.
  }
}

export default db;
