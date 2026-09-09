import React, { useState } from 'react';
import { X, Plus, Calendar, Users, Tag, CheckSquare, AlignLeft } from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function NewTaskModal({
  columns,
  users,
  currentUser,
  boardId,
  initialColumnId,
  initialDueDate,
  onClose,
  onCreateTask,
}) {
  const [title, setTitle] = useState('');
  const [columnId, setColumnId] = useState(initialColumnId || columns[0]?.id || '');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState(initialDueDate || '');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  const handleToggleAssignee = (userId) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter((id) => id !== userId));
    } else {
      setAssignees([...assignees, userId]);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, subtaskInput.trim()]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (idx) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreateTask({
      board_id: boardId,
      column_id: columnId,
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      assignees,
      tags,
      created_by: currentUser?.name || 'Membro da Equipe',
      initialSubtasks: subtasks,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 max-h-[90vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nova Tarefa</h3>
            <p className="text-xs text-slate-500">Adicione uma demanda para a equipe</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário Scrollável */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pt-4 flex-1 pr-1">
          
          {/* Título */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Título da Tarefa *</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenvolver nova funcionalidade, Enviar relatório..."
              className="w-full text-sm font-semibold py-2.5 px-3.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Coluna e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Coluna / Bucket</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white font-medium focus:border-blue-500 focus:outline-hidden"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white font-medium focus:border-blue-500 focus:outline-hidden"
              >
                <option value="urgente">🔴 Urgente</option>
                <option value="alta">🟠 Alta</option>
                <option value="media">🔵 Média</option>
                <option value="baixa">⚪ Baixa</option>
              </select>
            </div>
          </div>

          {/* Prazo e Responsáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data de Entrega (Prazo)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Responsáveis
              </label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {users.map((u) => {
                  const isAssigned = assignees.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleToggleAssignee(u.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
                        isAssigned
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full text-white font-bold flex items-center justify-center text-[8px]"
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
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Descrição e Requisitos
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que precisa ser feito..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden resize-y"
            />
          </div>

          {/* Checklist Inicial */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Itens do Checklist (Opcional)
            </label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <span>{st}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(i)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask(e);
                }}
                placeholder="Digitar item e pressionar Adicionar..."
                className="flex-1 text-xs py-1.5 px-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Etiquetas
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-blue-400 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Digitar tag e pressionar Enter..."
                className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              Criar Tarefa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
