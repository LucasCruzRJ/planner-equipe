import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  Clock,
  CheckSquare,
  MessageSquare,
  Users,
  Tag,
  Trash2,
  Send,
  Plus,
  AlertTriangle,
  AlignLeft,
  CheckCircle2,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { getPriorityMeta, getUserInitials } from '../utils/helpers';

export function TaskModal({
  task,
  columns,
  users,
  currentUser,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddComment,
}) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'media');
  const [columnId, setColumnId] = useState(task.column_id || '');
  const [startDate, setStartDate] = useState(task.start_date || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [assignees, setAssignees] = useState(task.assignees || []);
  const [tags, setTags] = useState(task.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Verificação de Permissões
  const isAdmin = currentUser?.is_admin === 1 || currentUser?.role?.toLowerCase().includes('gestor') || currentUser?.role?.toLowerCase().includes('chefe');
  const isCreator = (task.created_by_user_id && task.created_by_user_id === currentUser?.id) || (!task.created_by_user_id && task.created_by === currentUser?.name);
  const isAssignee = (task.assignees || []).includes(currentUser?.id);

  // canModify: Pode editar título, descrição, datas, prioridade e tags
  const canModify = isAdmin || isCreator || isAssignee;
  // canDelete: Apenas criador ou gestor
  const canDelete = isAdmin || isCreator;

  useEffect(() => {
    setTitle(task.title || '');
    setDescription(task.description || '');
    setPriority(task.priority || 'media');
    setColumnId(task.column_id || '');
    setStartDate(task.start_date || '');
    setDueDate(task.due_date || '');
    setAssignees(task.assignees || []);
    setTags(task.tags || []);
  }, [task]);

  const handleSaveField = async (fields) => {
    if (!canModify) return;
    setIsSaving(true);
    await onUpdateTask(task.id, fields);
    setIsSaving(false);
  };

  const handleToggleAssignee = (userId) => {
    if (!canModify) return;
    let updated;
    if (assignees.includes(userId)) {
      updated = assignees.filter((id) => id !== userId);
    } else {
      updated = [...assignees, userId];
    }
    setAssignees(updated);
    handleSaveField({ assignees: updated });
  };

  const handleAddTag = (e) => {
    if (!canModify) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        const updated = [...tags, val];
        setTags(updated);
        setNewTagInput('');
        handleSaveField({ tags: updated });
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!canModify) return;
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    handleSaveField({ tags: updated });
  };

  const handleColumnChange = (newColId) => {
    if (!canModify) return;
    setColumnId(newColId);
    handleSaveField({ column_id: newColId });

    const targetCol = columns.find((c) => c.id === newColId);
    if (targetCol && (targetCol.title.toLowerCase().includes('conclu') || targetCol.title.toLowerCase().includes('done'))) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleCreateSubtask = (e) => {
    e.preventDefault();
    if (!canModify || !newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleCreateComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(task.id, {
      author_name: currentUser?.name || 'Colega',
      author_avatar: currentUser?.avatar_color || '#3b82f6',
      content: newCommentText.trim(),
    });
    setNewCommentText('');
  };

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;
  const comments = task.comments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Banner de Aviso quando em Modo Leitura */}
        {!canModify && (
          <div className="bg-amber-500 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Modo Apenas Leitura:</strong> Esta tarefa foi criada por <strong>{task.created_by || 'outro colega'}</strong>. Apenas o criador ou o Gestor podem fazer alterações.
              </span>
            </div>
            <span className="text-[10px] bg-amber-600/60 px-2 py-0.5 rounded-md font-mono">Bloqueada</span>
          </div>
        )}

        {/* Barra Superior do Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          
          <div className="flex items-center gap-3">
            {/* Seletor de Coluna / Bucket */}
            <select
              disabled={!canModify}
              value={columnId}
              onChange={(e) => handleColumnChange(e.target.value)}
              className={`text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-white transition text-slate-800 ${
                !canModify ? 'opacity-70 cursor-not-allowed bg-slate-100' : 'hover:border-slate-300'
              }`}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Seletor de Prioridade */}
            <select
              disabled={!canModify}
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                handleSaveField({ priority: e.target.value });
              }}
              className={`text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-white transition text-slate-800 ${
                !canModify ? 'opacity-70 cursor-not-allowed bg-slate-100' : 'hover:border-slate-300'
              }`}
            >
              <option value="urgente">🔴 Urgente</option>
              <option value="alta">🟠 Alta</option>
              <option value="media">🔵 Média</option>
              <option value="baixa">⚪ Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="Excluir tarefa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal (Scrollável) */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Título da Tarefa */}
          <div>
            <input
              type="text"
              disabled={!canModify}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSaveField({ title })}
              placeholder="Título da tarefa..."
              className={`w-full text-xl sm:text-2xl font-bold text-slate-900 border-b border-transparent py-1 transition ${
                canModify
                  ? 'hover:border-slate-200 focus:border-blue-500 focus:outline-hidden'
                  : 'bg-transparent cursor-default'
              }`}
            />
          </div>

          {/* Grid de Metadados: Prazos e Responsáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
            
            {/* Responsáveis */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5" />
                Membros Responsáveis
              </label>
              <div className="flex flex-wrap gap-1.5">
                {users.map((u) => {
                  const isAssigned = assignees.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => handleToggleAssignee(u.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        isAssigned
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      } ${!canModify ? 'cursor-default opacity-80' : ''}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full text-white font-bold flex items-center justify-center text-[9px]"
                        style={{ backgroundColor: isAssigned ? '#1e40af' : u.avatar_color }}
                      >
                        {getUserInitials(u.name)}
                      </div>
                      <span>{u.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prazos */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Data de Entrega (Prazo)
                </label>
                <input
                  type="date"
                  disabled={!canModify}
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleSaveField({ due_date: e.target.value });
                  }}
                  className={`w-full text-xs font-medium py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden ${
                    canModify ? 'focus:border-blue-500' : 'cursor-not-allowed bg-slate-100/70'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Descrição e Notas */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlignLeft className="w-3.5 h-3.5" />
              Descrição e Detalhes
            </label>
            <textarea
              rows={4}
              disabled={!canModify}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSaveField({ description })}
              placeholder={canModify ? "Adicione informações detalhadas, requisitos ou anotações..." : "Sem descrição detalhada."}
              className={`w-full text-sm text-slate-800 p-3 bg-white border border-slate-200 rounded-xl leading-relaxed resize-y ${
                canModify ? 'focus:border-blue-500 focus:outline-hidden transition' : 'bg-slate-50/50 cursor-default'
              }`}
            />
          </div>

          {/* Etiquetas / Tags */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5" />
              Etiquetas (Tags)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100"
                >
                  #{tag}
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-400 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {canModify && (
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Digitar tag e Enter..."
                  className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              )}
            </div>
          </div>

          {/* Checklist / Subtarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                Checklist ({completedCount}/{subtasks.length})
              </label>
              {subtasks.length > 0 && (
                <span className="text-xs font-bold text-blue-600">{progressPct}%</span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}

            <div className="space-y-2 mb-3">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition group"
                >
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={!canModify}
                      checked={!!st.completed}
                      onChange={(e) => onToggleSubtask(st.id, e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-50"
                    />
                    <span
                      className={`text-xs font-medium ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => onDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canModify && (
              <form onSubmit={handleCreateSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Adicionar um item ao checklist..."
                  className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </form>
            )}
          </div>

          {/* Seção de Discussão / Comentários em Tempo Real (Aberto para toda a equipe colaborar) */}
          <div className="border-t border-slate-100 pt-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              Discussão da Equipe ({comments.length})
            </label>

            <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
              {comments.map((comm) => (
                <div key={comm.id} className="flex gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div
                    className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: comm.author_avatar || '#3b82f6' }}
                  >
                    {getUserInitials(comm.author_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{comm.author_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                      {comm.content}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  Nenhum comentário nesta tarefa ainda. Envie uma dúvida ou nota para a equipe!
                </p>
              )}
            </div>

            {/* Formulário de Envio de Comentário */}
            <form onSubmit={handleCreateComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={`Comentar como ${currentUser?.name || 'Colega'}...`}
                className="flex-1 text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </form>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Criado por: <strong>{task.created_by || 'Equipe'}</strong>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition"
          >
            {canModify ? 'Concluir Edição' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}
