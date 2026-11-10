import React, { useState, useEffect, useMemo } from 'react';
import { Lock, User, UserPlus, LogIn, Shield, Check, AlertCircle, KeyRound, Search, Sparkles, Code2, Crown } from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function LoginModal({ users = [], onLogin, onRegister }) {
  // Se não houver usuários cadastrados no sistema, abre direto em 'register'
  const [mode, setMode] = useState(() => (users.length === 0 ? 'register' : 'direct')); // 'direct' | 'select' | 'register'
  const [selectedUser, setSelectedUser] = useState(users[0] || null);
  const [searchMember, setSearchMember] = useState('');
  
  // Login Direto (Nome ou E-mail + Senha)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');

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

  // Sincroniza usuário selecionado quando a lista carregar
  useEffect(() => {
    if (users.length === 0) {
      setMode('register');
    } else if (!selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  // Lista de membros filtrada pela busca
  const filteredUsers = useMemo(() => {
    if (!searchMember.trim()) return users;
    const q = searchMember.toLowerCase();
    return users.filter((u) => 
      u.name.toLowerCase().includes(q) || (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, searchMember]);

  // 1. Login Direto (Digitando Nome ou E-mail + Senha)
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !password.trim()) {
      setErrorMsg('Preencha seu nome/e-mail e sua senha');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
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

  // 2. Login Rápido (Selecionando o card do usuário na lista + Senha)
  const handleQuickLogin = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg('Selecione seu usuário na lista');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Digite sua senha');
      return;
    }
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

  // 3. Cadastro de Novo Usuário
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim()) {
      setErrorMsg('Nome e senha são obrigatórios');
      return;
    }
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
          role: regRole.trim() || 'Membro da Equipe',
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
            Entre na sua conta para gerenciar e acompanhar as tarefas da sua equipe
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
              setMode('direct');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'direct' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Entrar
          </button>
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
            Membros ({users.length})
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

        {/* MODO 1: ENTRAR COM NOME OU E-MAIL (Mais simples e intuitivo) */}
        {mode === 'direct' && (
          <form onSubmit={handleDirectLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Seu Nome ou E-mail</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Ex: Carlos ou carlos@empresa.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Sua Senha</label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Entrando...' : 'Entrar no Planner'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Primeira vez aqui? Crie seu usuário agora →
              </button>
            </div>
          </form>
        )}

        {/* MODO 2: ESCOLHER MEMBRO DA LISTA COM BUSCA */}
        {mode === 'select' && (
          <form onSubmit={handleQuickLogin} className="space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selecione seu perfil:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">{filteredUsers.length} encontrados</span>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Buscar pelo nome..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden bg-slate-50"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  Nenhum membro encontrado.
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="block mx-auto mt-1 text-blue-600 font-bold hover:underline"
                  >
                    Cadastrar Novo Membro
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {filteredUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    const isAdmin = u.is_admin === 1 || u.role?.toLowerCase().includes('gestor') || u.role?.toLowerCase().includes('chefe');
                    const isDev = u.role?.toLowerCase().includes('desenvolvedor') || u.role?.toLowerCase().includes('dev');

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
                            <div className="text-xs font-bold truncate flex items-center gap-1">
                              <span>{u.name}</span>
                              {isAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                              {!isAdmin && isDev && <Code2 className="w-3 h-3 text-blue-300 shrink-0" />}
                            </div>
                            <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              {isAdmin ? '👑 Gestor / Chefe' : (isDev ? '💻 Desenvolvedor' : u.role || 'Membro')}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Digite sua Senha</label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha cadastrada"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Validando...' : `Entrar como ${selectedUser ? selectedUser.name : 'Membro'}`}
            </button>
          </form>
        )}

        {/* MODO 3: NOVO CADASTRO */}
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
                placeholder="Ex: Carlos Ferreira"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cargo / Setor (opcional)</label>
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
                placeholder="carlos@empresa.com"
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
