import React, { useState } from 'react';
import { X, Users, Crown, Shield, Trash2, Edit2, Check, UserPlus } from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function TeamModal({
  users,
  currentUser,
  onClose,
  onUpdateUser,
  onDeleteUser,
}) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const startEditing = (u) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role || 'Membro da Equipe');
    setEditIsAdmin(!!u.is_admin);
  };

  const handleSaveEdit = async (userId) => {
    if (!editName.trim()) return;
    await onUpdateUser(userId, {
      name: editName.trim(),
      role: editRole.trim() || (editIsAdmin ? 'Gestor / Chefe' : 'Membro da Equipe'),
      is_admin: editIsAdmin ? 1 : 0,
    });
    setEditingUserId(null);
  };

  const toggleAdmin = async (u) => {
    const nextAdmin = u.is_admin ? 0 : 1;
    await onUpdateUser(u.id, {
      is_admin: nextAdmin,
      role: nextAdmin ? (u.role.includes('Gestor') ? u.role : 'Gestor / Chefe') : (u.role.includes('Gestor') ? 'Membro da Equipe' : u.role),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5 flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Membros da Equipe</h3>
              <p className="text-xs text-slate-500">Defina quem é o Gestor/Chefe e ajuste os nomes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dica Informativa */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
          <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Usuários com <strong>👑 Gestor/Chefe</strong> têm permissão total para alterar, mover e aprovar tarefas de qualquer colega. Você pode promover o seu chefe ou editar qualquer membro abaixo.
          </p>
        </div>

        {/* Lista de Membros */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {users.map((u) => {
            const isEditing = editingUserId === u.id;
            const isAdmin = u.is_admin === 1;

            if (isEditing) {
              return (
                <div key={u.id} className="p-3.5 bg-slate-50 border border-blue-400 rounded-2xl space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div 
                    onClick={() => setEditIsAdmin(!editIsAdmin)}
                    className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={editIsAdmin}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <span>👑 Definir como Gestor / Chefe (Acesso Master)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(u.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Salvar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={u.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  isAdmin
                    ? 'bg-amber-50/40 border-amber-200/90'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
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
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <span>{u.name}</span>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                          <Crown className="w-3 h-3 text-amber-600" /> Gestor
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{u.role || 'Membro da Equipe'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Botão de Promover/Rebaixar Gestor */}
                  <button
                    onClick={() => toggleAdmin(u)}
                    title={isAdmin ? "Remover privilégio de Gestor" : "Tornar Gestor / Chefe"}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      isAdmin
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAdmin ? 'É Gestor' : 'Tornar Gestor'}</span>
                  </button>

                  {/* Editar Nome e Cargo */}
                  <button
                    onClick={() => startEditing(u)}
                    title="Editar nome ou cargo"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Excluir Membro */}
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover ${u.name} da equipe?`)) {
                        onDeleteUser(u.id);
                      }
                    }}
                    title="Remover membro"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}