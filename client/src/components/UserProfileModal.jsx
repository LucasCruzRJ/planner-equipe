import React, { useState } from 'react';
import { X, User, UserPlus, Check, Sparkles } from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function UserProfileModal({
  users,
  currentUser,
  onSelectUser,
  onCreateUser,
  onClose,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const avatarColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#64748b'
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await onCreateUser({
      name: newName.trim(),
      role: newRole.trim() || 'Membro da Equipe',
      email: newEmail.trim(),
      avatar_color: newColor,
    });

    setIsCreating(false);
    setNewName('');
    setNewRole('');
    setNewEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Identificação no Planner</h3>
              <p className="text-xs text-slate-500">Escolha seu nome para comentários e tarefas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCreating ? (
          <>
            {/* Lista de Membros Existentes */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quem é você na equipe?
              </p>
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: u.avatar_color || '#3b82f6' }}
                      >
                        {getUserInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{u.name}</div>
                        <div className="text-xs text-slate-500 truncate">{u.role || 'Membro'}</div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Botão para cadastrar novo membro */}
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-dashed border-slate-300 flex items-center justify-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Novo Membro / Meu Nome
            </button>
          </>
        ) : (
          /* Formulário de Criação de Membro */
          <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Nome Completo</label>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Cargo / Setor</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Ex: Desenvolvedor, Marketing, Suporte..."
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Cor do Avatar</label>
              <div className="flex gap-2">
                {avatarColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition ${
                      newColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
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
                Salvar e Entrar
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
