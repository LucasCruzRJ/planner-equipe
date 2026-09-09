import React, { useState } from 'react';
import { Lock, User, UserPlus, LogIn, Shield, Check, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function LoginModal({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState('select'); // 'select' | 'email' | 'register'
  const [selectedUser, setSelectedUser] = useState(users[0] || null);
  const [password, setPassword] = useState('');
  const [emailInput, setEmailInput] = useState('');
  
  // Dados de Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Membro da Equipe');
  const [regColor, setRegColor] = useState('#3b82f6');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const avatarColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#64748b'
  ];

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao entrar');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !password.trim()) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao entrar');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim()) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          role: regRole.trim(),
          avatar_color: regColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar');
      }

      onRegister(data.user, data.token);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 sm:p-8 space-y-5">
        
        {/* Cabeçalho do Login */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 font-bold mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acesso ao Planner de Equipe</h2>
          <p className="text-xs text-slate-500">
            Identifique-se com sua senha para proteger suas tarefas e acompanhar o quadro
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Abas de Navegação */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('select');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'select' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Escolher Membro
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('email');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'email' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Entrar com E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'register' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Novo Cadastro
          </button>
        </div>

        {/* Modo 1: Escolher Membro da Lista + Senha (Mais Rápido) */}
        {mode === 'select' && (
          <form onSubmit={handleQuickLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Selecione quem é você:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-[10px] shadow-2xs shrink-0"
                          style={{ backgroundColor: isSelected ? '#1e40af' : u.avatar_color }}
                        >
                          {getUserInitials(u.name)}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold truncate">{u.name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {u.is_admin ? '👑 Gestor / Chefe' : u.role || 'Membro'}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Digite sua Senha / PIN</label>
                <span className="text-[10px] text-slate-400 font-medium">Padrão inicial: <strong>1234</strong></span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Validando acesso...' : 'Entrar no Planner'}
            </button>
          </form>
        )}

        {/* Modo 2: E-mail e Senha */}
        {mode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">E-mail corporativo</label>
              <input
                type="email"
                required
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="seu.nome@empresa.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Verificando...' : 'Entrar com E-mail'}
            </button>
          </form>
        )}

        {/* Modo 3: Cadastro de Novo Membro */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Seu Nome Completo *</label>
              <input
                type="text"
                required
                autoFocus
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ex: Roberto Gomes"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cargo / Setor</label>
                <input
                  type="text"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  placeholder="Ex: Analista"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Senha de Acesso *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 3 dígitos"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="roberto@empresa.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cor do Avatar</label>
              <div className="flex gap-2">
                {avatarColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setRegColor(c)}
                    className={`w-6 h-6 rounded-full transition ${
                      regColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Cadastrando...' : 'Criar Minha Conta e Entrar'}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Suas tarefas só poderão ser alteradas por você ou pelo Gestor.
          </p>
        </div>

      </div>
    </div>
  );
}
