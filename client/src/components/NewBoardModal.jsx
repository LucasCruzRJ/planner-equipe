import React, { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';

export function NewBoardModal({ onClose, onCreateBoard }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const boardColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#475569'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateBoard({
      title: title.trim(),
      description: description.trim(),
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Novo Plano / Projeto</h3>
              <p className="text-xs text-slate-500">Crie um novo quadro para organizar demandas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Nome do Plano</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Projeto Expansão 2026, Marketing Digital..."
              className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Descrição / Objetivo</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo deste plano para a equipe..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Cor de Identificação</label>
            <div className="flex gap-2">
              {boardColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              Criar Plano
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
