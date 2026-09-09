import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Users,
  Flame,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { formatDueDate, getUserInitials } from '../utils/helpers';

export function DashboardView({ tasks, columns, users }) {
  const totalTasks = tasks.length;
  
  // Identificar coluna de concluídos (geralmente última coluna ou com nome 'concluído')
  const completedColumnIds = columns
    .filter((c) => c.title.toLowerCase().includes('conclu') || c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('finaliz'))
    .map((c) => c.id);

  const completedTasks = tasks.filter((t) =>
    completedColumnIds.includes(t.column_id)
  );

  const overdueTasks = tasks.filter((t) => {
    if (completedColumnIds.includes(t.column_id)) return false;
    const due = formatDueDate(t.due_date);
    return due && due.status === 'overdue';
  });

  const inProgressTasks = tasks.filter(
    (t) => !completedColumnIds.includes(t.column_id)
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Tarefas por coluna
  const tasksByColumn = columns.map((col) => {
    const count = tasks.filter((t) => t.column_id === col.id).length;
    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
    return { ...col, count, pct };
  });

  // Tarefas por prioridade
  const priorities = [
    { key: 'urgente', label: 'Urgente', color: 'bg-red-500', text: 'text-red-600', count: tasks.filter((t) => t.priority === 'urgente').length },
    { key: 'alta', label: 'Alta', color: 'bg-orange-500', text: 'text-orange-600', count: tasks.filter((t) => t.priority === 'alta').length },
    { key: 'media', label: 'Média', color: 'bg-blue-500', text: 'text-blue-600', count: tasks.filter((t) => t.priority === 'media').length },
    { key: 'baixa', label: 'Baixa', color: 'bg-slate-400', text: 'text-slate-600', count: tasks.filter((t) => t.priority === 'baixa').length },
  ];

  // Tarefas por usuário
  const tasksByUser = users.map((u) => {
    const userTasks = tasks.filter((t) => (t.assignees || []).includes(u.id));
    const userCompleted = userTasks.filter((t) => completedColumnIds.includes(t.column_id)).length;
    return {
      ...u,
      total: userTasks.length,
      completed: userCompleted,
      active: userTasks.length - userCompleted,
    };
  }).sort((a, b) => b.total - a.total);

  // Subtarefas totais
  let totalSubtasksCount = 0;
  let completedSubtasksCount = 0;
  tasks.forEach((t) => {
    (t.subtasks || []).forEach((st) => {
      totalSubtasksCount++;
      if (st.completed) completedSubtasksCount++;
    });
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total de Tarefas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Demandas</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTasks}</h3>
            <p className="text-xs text-slate-500 mt-1">no plano selecionado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Taxa de Conclusão */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Concluídas</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-emerald-600">{completedTasks.length}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {completionRate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">taxa de entrega</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Em Andamento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Andamento</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{inProgressTasks.length}</h3>
            <p className="text-xs text-slate-500 mt-1">demandas ativas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Atrasadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atrasadas</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{overdueTasks.length}</h3>
            <p className="text-xs text-slate-500 mt-1">necessitam atenção</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gráficos de Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribuição por Coluna / Fluxo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            Progresso por Coluna (Fluxo de Trabalho)
          </h3>
          <div className="space-y-4">
            {tasksByColumn.map((col) => (
              <div key={col.id}>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span>{col.title}</span>
                  </div>
                  <span>
                    {col.count} tarefas ({col.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${col.pct}%`, backgroundColor: col.color || '#3b82f6' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Prioridade */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Demandas por Nível de Prioridade
          </h3>
          <div className="space-y-4">
            {priorities.map((p) => {
              const pct = totalTasks > 0 ? Math.round((p.count / totalTasks) * 100) : 0;
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <span>{p.label}</span>
                    </div>
                    <span>
                      {p.count} tarefas ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Carga de Trabalho por Membro da Equipe */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Carga de Trabalho da Equipe
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksByUser.map((user) => {
            const userPct = user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0;

            return (
              <div
                key={user.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs"
                    style={{ backgroundColor: user.avatar_color || '#3b82f6' }}
                  >
                    {getUserInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{user.name}</h4>
                    <p className="text-xs text-slate-500">{user.role || 'Membro da Equipe'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>
                    <strong>{user.active}</strong> em aberto
                  </span>
                  <span>
                    <strong>{user.completed}</strong> concluídas
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${userPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
