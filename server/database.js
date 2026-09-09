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

  // Seed / Atualização de dados padrão com autenticação
  seedDefaultData();
}

function seedDefaultData() {
  const defaultPassword = '1234';
  const { hash, salt } = hashPassword(defaultPassword);

  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, role, is_admin, password_hash, password_salt, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultUsers = [
      ['u-1', 'Ana Silva', 'ana.silva@empresa.com', 'Gestora de Projetos (Chefe)', 1, hash, salt, '#8b5cf6'],
      ['u-2', 'Carlos Eduardo', 'carlos.edu@empresa.com', 'Desenvolvedor / Técnico', 0, hash, salt, '#3b82f6'],
      ['u-3', 'Mariana Costa', 'mariana.costa@empresa.com', 'Designer / UX', 0, hash, salt, '#ec4899'],
      ['u-4', 'Lucas Mendes', 'lucas.mendes@empresa.com', 'Analista de Operações', 0, hash, salt, '#10b981'],
    ];

    for (const u of defaultUsers) {
      insertUser.run(...u);
    }
  } else {
    // Atualizar senhas e admin para usuários que ainda não tenham hash
    db.prepare(`
      UPDATE users
      SET password_hash = COALESCE(password_hash, ?),
          password_salt = COALESCE(password_salt, ?)
      WHERE password_hash IS NULL
    `).run(hash, salt);

    // Garantir que a Gestora seja Admin
    db.prepare(`
      UPDATE users
      SET is_admin = 1, role = 'Gestora de Projetos (Chefe)'
      WHERE id = 'u-1' OR email = 'ana.silva@empresa.com'
    `).run();
  }

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

    // Tarefas de exemplo com prazos realistas e criadores definidos
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const formatDate = (d) => d.toISOString().split('T')[0];

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, board_id, column_id, title, description, priority, start_date, due_date, position, tags, assignees, created_by, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultTasks = [
      [
        'task-1',
        boardId,
        'col-3',
        'Estruturar o novo fluxo de entregas da equipe',
        'Alinhar o passo a passo com todos os responsáveis para garantir visibilidade e prazos cumpridos.',
        'alta',
        formatDate(today),
        formatDate(tomorrow),
        0,
        JSON.stringify(['Planejamento', 'Processos']),
        JSON.stringify(['u-1', 'u-2']),
        'Ana Silva',
        'u-1'
      ],
      [
        'task-2',
        boardId,
        'col-2',
        'Revisar relatórios de desempenho mensal',
        'Compilar os dados de produtividade e preparar a apresentação para a diretoria.',
        'urgente',
        formatDate(today),
        formatDate(today),
        0,
        JSON.stringify(['Relatório', 'Urgente']),
        JSON.stringify(['u-4']),
        'Lucas Mendes',
        'u-4'
      ],
      [
        'task-3',
        boardId,
        'col-4',
        'Validar protótipos de telas e usabilidade',
        'Coletar feedback da equipe sobre os novos layouts e componentes visuais.',
        'media',
        formatDate(yesterday),
        formatDate(nextWeek),
        0,
        JSON.stringify(['Design', 'UX']),
        JSON.stringify(['u-3']),
        'Mariana Costa',
        'u-3'
      ],
      [
        'task-4',
        boardId,
        'col-5',
        'Configuração inicial do Planner de Equipe',
        'Instalação e disponibilização do sistema na nuvem com autenticação segura.',
        'alta',
        formatDate(yesterday),
        formatDate(today),
        0,
        JSON.stringify(['TI', 'Infra']),
        JSON.stringify(['u-2']),
        'Carlos Eduardo',
        'u-2'
      ],
      [
        'task-5',
        boardId,
        'col-1',
        'Pesquisar integrações com notificações automáticas',
        'Verificar viabilidade de alertas sonoros e e-mails para tarefas com prazo próximo.',
        'baixa',
        null,
        null,
        0,
        JSON.stringify(['Melhorias', 'Inovação']),
        JSON.stringify(['u-2']),
        'Carlos Eduardo',
        'u-2'
      ]
    ];

    for (const t of defaultTasks) {
      insertTask.run(...t);
    }

    // Subtarefas para a tarefa 1
    const insertSubtask = db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position) VALUES (?, ?, ?, ?, ?)
    `);

    insertSubtask.run('st-1', 'task-1', 'Mapear responsáveis por cada etapa', 1, 0);
    insertSubtask.run('st-2', 'task-1', 'Definir critérios de conclusão (DoD)', 1, 1);
    insertSubtask.run('st-3', 'task-1', 'Apresentar modelo na reunião semanal', 0, 2);

    // Subtarefas para a tarefa 4
    insertSubtask.run('st-4', 'task-4', 'Configurar servidor em tempo real', 1, 0);
    insertSubtask.run('st-5', 'task-4', 'Testar conexão entre computadores na rede', 1, 1);

    // Comentários de exemplo
    const insertComment = db.prepare(`
      INSERT INTO comments (id, task_id, author_name, author_id, author_avatar, content) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertComment.run(
      'c-1',
      'task-1',
      'Ana Silva',
      'u-1',
      '#8b5cf6',
      'Já adicionei os primeiros itens no checklist. Carlos, você pode dar uma olhada na etapa técnica?'
    );

    insertComment.run(
      'c-2',
      'task-1',
      'Carlos Eduardo',
      'u-2',
      '#3b82f6',
      'Perfeito Ana! Revisei e ajustei os prazos previstos. Tudo pronto para a reunião.'
    );
  } else {
    // Atualizar tarefas legadas que não tinham created_by_user_id
    db.prepare(`
      UPDATE tasks
      SET created_by_user_id = (
        SELECT id FROM users WHERE users.name = tasks.created_by LIMIT 1
      )
      WHERE created_by_user_id IS NULL
    `).run();
  }
}

export default db;
