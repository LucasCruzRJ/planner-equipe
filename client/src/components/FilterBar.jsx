import React from 'react';
import { Search, Filter, X, User, AlertCircle, Tag, CheckSquare } from 'lucide-react';

export function FilterBar({
  searchQuery,
  onSearchChange,
  users,
  selectedAssignee,
  onSelectAssignee,
  selectedPriority,
  onSelectPriority,
  selectedTag,
  onSelectTag,
  availableTags,
  onlyOverdue,
  onToggleOnlyOverdue,
  onlyMyTasks,
  onToggleOnlyMyTasks,
  onClearFilters,
}) {
  const hasActiveFilters =
    searchQuery ||
    selectedAssignee ||
    selectedPriority ||
    selectedTag ||
    onlyOverdue ||
    onlyMyTasks;

  return (
    <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Campo de Busca em Tempo Real */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tarefas por título, descrição ou responsável..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros Dropdowns e Pílulas Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Filtro por Responsável */}
          <div className="relative">
            <select
              value={selectedAssignee}
              onChange={(e) => onSelectAssignee(e.target.value)}
              className={`py-1.5 px-2.5 text-xs rounded-lg border appearance-none pr-7 bg-white font-medium cursor-pointer transition ${
                selectedAssignee
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <option value="">👤 Todos os Responsáveis</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Prioridade */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => onSelectPriority(e.target.value)}
              className={`py-1.5 px-2.5 text-xs rounded-lg border appearance-none pr-7 bg-white font-medium cursor-pointer transition ${
                selectedPriority
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <option value="">⚡ Todas as Prioridades</option>
              <option value="urgente">🔴 Urgente</option>
              <option value="alta">🟠 Alta</option>
              <option value="media">🔵 Média</option>
              <option value="baixa">⚪ Baixa</option>
            </select>
          </div>

          {/* Filtro por Tag */}
          {availableTags.length > 0 && (
            <div className="relative">
              <select
                value={selectedTag}
                onChange={(e) => onSelectTag(e.target.value)}
                className={`py-1.5 px-2.5 text-xs rounded-lg border appearance-none pr-7 bg-white font-medium cursor-pointer transition ${
                  selectedTag
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="">🏷️ Todas as Etiquetas</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Atalho: Apenas Minhas Tarefas */}
          <button
            onClick={onToggleOnlyMyTasks}
            className={`flex items-center gap-1.5 py-1.5 px-3 text-xs rounded-lg border transition font-medium ${
              onlyMyTasks
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Minhas Tarefas
          </button>

          {/* Atalho: Apenas Atrasadas */}
          <button
            onClick={onToggleOnlyOverdue}
            className={`flex items-center gap-1.5 py-1.5 px-3 text-xs rounded-lg border transition font-medium ${
              onlyOverdue
                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            Atrasadas
          </button>

          {/* Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 py-1.5 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              title="Limpar todos os filtros"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
