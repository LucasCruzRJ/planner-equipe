import React from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { formatDueDate, getPriorityMeta, getUserInitials } from '../utils/helpers';

export function TaskCard({ task, users, onOpenTask, provided, isDragging }) {
  const priorityMeta = getPriorityMeta(task.priority);
  const dueInfo = formatDueDate(task.due_date);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const commentsCount = (task.comments || []).length;
  const taskAssignees = (task.assignees || [])
    .map((uid) => users.find((u) => u.id === uid))
    .filter(Boolean);

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      onClick={() => onOpenTask(task)}
      className={`group relative bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer select-none ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-1 scale-[1.02] z-50' : ''
      }`}
    >
      {/* Barra superior de prioridade e tags */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
          {priorityMeta.label}
        </span>

        {/* Tags / Etiquetas */}
        <div className="flex flex-wrap gap-1 items-center max-w-[60%] justify-end overflow-hidden">
          {(task.tags || []).slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="inline-block text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md truncate max-w-[90px]"
            >
              #{tag}
            </span>
          ))}
          {(task.tags || []).length > 2 && (
            <span className="text-[10px] text-slate-400">+{task.tags.length - 2}</span>
          )}
        </div>
      </div>

      {/* Título da Tarefa */}
      <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition line-clamp-2">
        {task.title}
      </h4>

      {/* Checklist / Barra de Progresso de Subtarefas */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              Checklist
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rodapé do Card: Data de Entrega, Comentários e Responsáveis */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
        
        {/* Informação de Prazo */}
        <div className="flex items-center gap-2">
          {dueInfo ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                dueInfo.status === 'overdue'
                  ? 'bg-red-50 text-red-600 font-semibold'
                  : dueInfo.status === 'today'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {dueInfo.status === 'overdue' ? (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              ) : dueInfo.status === 'today' ? (
                <Clock className="w-3 h-3 text-amber-500" />
              ) : (
                <Calendar className="w-3 h-3 text-slate-400" />
              )}
              {dueInfo.text}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Sem prazo</span>
          )}

          {/* Contador de Comentários */}
          {commentsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              {commentsCount}
            </span>
          )}
        </div>

        {/* Avatares dos Responsáveis */}
        <div className="flex -space-x-1.5 overflow-hidden shrink-0">
          {taskAssignees.slice(0, 3).map((u, i) => (
            <div
              key={i}
              title={u.name}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white text-white font-bold flex items-center justify-center text-[10px] shadow-xs"
              style={{ backgroundColor: u.avatar_color || '#3b82f6' }}
            >
              {getUserInitials(u.name)}
            </div>
          ))}
          {taskAssignees.length > 3 && (
            <div className="inline-block h-6 w-6 rounded-full bg-slate-200 ring-2 ring-white text-slate-700 font-semibold flex items-center justify-center text-[10px]">
              +{taskAssignees.length - 3}
            </div>
          )}
          {taskAssignees.length === 0 && (
            <div
              title="Sem responsável atribuído"
              className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
