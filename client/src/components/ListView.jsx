import React, { useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Clock,
  Plus,
  Lock,
} from 'lucide-react';
import { formatDueDate, getPriorityMeta, getUserInitials } from '../utils/helpers';

export function ListView({
  tasks,
  columns,
  users,
  currentUser,
  onOpenTask,
  onNewTask,
  onUpdateTask,
}) {
  const [sortField, setSortField] = useState('due_date');
  const [sortAsc, setSortAsc] = useState(true);

  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));
  const isAdmin = currentUser?.is_admin === 1 || currentUser?.role?.toLowerCase().includes('gestor') || currentUser?.role?.toLowerCase().includes('chefe');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'column_id') {
      valA = columnMap[a.column_id]?.position ?? 0;
      valB = columnMap[b.column_id]?.position ?? 0;
    } else if (sortField === 'priority') {
      const pWeights = { urgente: 4, alta: 3, media: 2, baixa: 1 };
      valA = pWeights[a.priority] || 0;
      valB = pWeights[b.priority] || 0;
    } else if (sortField === 'title') {
      valA = (a.title || '').toLowerCase();
      valB = (b.title || '').toLowerCase();
    } else if (sortField === 'due_date') {
      valA = a.due_date || '9999-99-99';
      valB = b.due_date || '9999-99-99';
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Cabeçalho da Tabela */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Lista Detalhada de Tarefas</h2>
            <p className="text-xs text-slate-500">
              Total de {tasks.length} {tasks.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'}
            </p>
          </div>
          <button
            onClick={() => onNewTask()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    Título da Tarefa
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('column_id')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    Status / Seção
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    Prioridade
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Responsáveis</th>
                <th
                  onClick={() => handleSort('due_date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    Data de Entrega
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Criado por</th>
                <th className="py-3 px-4">Checklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.map((task) => {
                const priorityMeta = getPriorityMeta(task.priority);
                const dueInfo = formatDueDate(task.due_date);
                const col = columnMap[task.column_id];

                const isCreator = (task.created_by_user_id && task.created_by_user_id === currentUser?.id) || (!task.created_by_user_id && task.created_by === currentUser?.name);
                const isAssignee = (task.assignees || []).includes(currentUser?.id);
                const canModify = isAdmin || isCreator || isAssignee;

                const subtasks = task.subtasks || [];
                const completedSubtasks = subtasks.filter((s) => s.completed).length;
                const totalSubtasks = subtasks.length;

                const taskAssignees = (task.assignees || [])
                  .map((uid) => users.find((u) => u.id === uid))
                  .filter(Boolean);

                return (
                  <tr
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    {/* Título e Tags */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs sm:max-w-sm">
                      <div className="flex items-center gap-1.5">
                        {!canModify && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Apenas leitura" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                      {(task.tags || []).length > 0 && (
                        <div className="flex gap-1 mt-1 overflow-hidden">
                          {task.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Coluna / Status (Dropdown inline se permitido) */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {canModify ? (
                        <select
                          value={task.column_id}
                          onChange={(e) => onUpdateTask(task.id, { column_id: e.target.value })}
                          className="text-xs font-medium py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                          {col?.title || 'Status'}
                        </span>
                      )}
                    </td>

                    {/* Prioridade */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityMeta.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                        {priorityMeta.label}
                      </span>
                    </td>

                    {/* Responsáveis */}
                    <td className="py-3.5 px-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {taskAssignees.map((u, i) => (
                          <div
                            key={i}
                            title={u.name}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white text-white font-bold flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: u.avatar_color || '#3b82f6' }}
                          >
                            {getUserInitials(u.name)}
                          </div>
                        ))}
                        {taskAssignees.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Sem responsável</span>
                        )}
                      </div>
                    </td>

                    {/* Data de Entrega */}
                    <td className="py-3.5 px-4">
                      {dueInfo ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                            dueInfo.status === 'overdue'
                              ? 'bg-red-50 text-red-600 font-semibold'
                              : dueInfo.status === 'today'
                              ? 'bg-amber-50 text-amber-700 font-semibold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {dueInfo.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                          {dueInfo.status === 'today' && <Clock className="w-3 h-3" />}
                          {dueInfo.text}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Criado por */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <span className="truncate max-w-[110px] inline-block">
                        {task.created_by || 'Equipe'}
                      </span>
                    </td>

                    {/* Checklist */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {totalSubtasks > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhuma tarefa encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
