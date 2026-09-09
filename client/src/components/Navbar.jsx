import React, { useState } from 'react';
import {
  Kanban,
  List,
  Calendar as CalendarIcon,
  BarChart3,
  Share2,
  Plus,
  Wifi,
  WifiOff,
  ChevronDown,
  Download,
  Users,
  FolderPlus,
  CheckCircle2,
} from 'lucide-react';
import { getUserInitials } from '../utils/helpers';

export function Navbar({
  boards,
  activeBoard,
  onSelectBoard,
  onOpenNewBoard,
  activeView,
  onSelectView,
  onlineUsers,
  connected,
  currentUser,
  onOpenProfile,
  onOpenShare,
  onNewTask,
  onExportCsv,
}) {
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Barra Superior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo e Seletor de Quadro */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold">
                <Kanban className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-900 leading-none">Planner de Equipe</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {connected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                      Sincronizado ao vivo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Reconectando...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Menu Dropdown de Planos / Quadros */}
            <div className="relative">
              <button
                onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-sm font-medium text-slate-800"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeBoard?.color || '#3b82f6' }} />
                <span className="max-w-[140px] md:max-w-[200px] truncate">{activeBoard?.title || 'Selecionar Plano'}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {boardDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBoardDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Meus Planos
                    </div>
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBoard(b);
                          setBoardDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm hover:bg-slate-50 transition ${
                          b.id === activeBoard?.id ? 'bg-blue-50/60 text-blue-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                          <span className="truncate">{b.title}</span>
                        </div>
                        {b.id === activeBoard?.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setBoardDropdownOpen(false);
                        onOpenNewBoard();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 font-medium transition"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Criar Novo Plano...
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Presença Online e Ações Rápidas */}
          <div className="flex items-center gap-3">
            
            {/* Membros Online na Rede */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full text-xs text-slate-600">
              <span className="font-medium">{onlineUsers.length} online:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {onlineUsers.slice(0, 4).map((u, i) => (
                  <div
                    key={i}
                    title={`${u.userName} (conectado)`}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white text-white font-bold flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: u.userColor || '#3b82f6' }}
                  >
                    {getUserInitials(u.userName)}
                  </div>
                ))}
                {onlineUsers.length > 4 && (
                  <div className="inline-block h-6 w-6 rounded-full bg-slate-300 ring-2 ring-white text-slate-700 font-semibold flex items-center justify-center text-[10px]">
                    +{onlineUsers.length - 4}
                  </div>
                )}
              </div>
            </div>

            {/* Perfil Atual do Usuário */}
            <button
              onClick={onOpenProfile}
              title="Clique para alterar seu nome ou perfil"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            >
              <div
                className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs"
                style={{ backgroundColor: currentUser?.avatar_color || '#3b82f6' }}
              >
                {getUserInitials(currentUser?.name)}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-xs font-semibold text-slate-800">{currentUser?.name || 'Você'}</div>
                <div className="text-[10px] text-slate-500">{currentUser?.role || 'Membro'}</div>
              </div>
            </button>

            {/* Compartilhar na Rede (Link para a equipe) */}
            <button
              onClick={onOpenShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Ver link e QR Code para a equipe acessar da rede"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Conectar Colegas</span>
            </button>

            {/* Exportar Excel/CSV */}
            <button
              onClick={onExportCsv}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Exportar tarefas para Excel (CSV)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Botão Nova Tarefa */}
            <button
              onClick={() => onNewTask()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Abas de Visualização (Quadro, Lista, Calendário, Métricas) */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1">
          <button
            onClick={() => onSelectView('board')}
            className={`flex items-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition ${
              activeView === 'board'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Quadro Kanban
          </button>

          <button
            onClick={() => onSelectView('list')}
            className={`flex items-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition ${
              activeView === 'list'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
            Lista Detalhada
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`flex items-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition ${
              activeView === 'calendar'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário de Prazos
          </button>

          <button
            onClick={() => onSelectView('dashboard')}
            className={`flex items-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition ${
              activeView === 'dashboard'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Estatísticas & Painel
          </button>
        </div>
      </div>
    </header>
  );
}
