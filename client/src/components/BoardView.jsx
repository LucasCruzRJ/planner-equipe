import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';
import { TaskCard } from './TaskCard';

export function BoardView({
  columns,
  tasks,
  users,
  onOpenTask,
  onNewTaskInColumn,
  onReorderTasks,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
}) {
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [openColMenuId, setOpenColMenuId] = useState(null);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    // Calcular novo array de IDs da coluna de destino
    const destColTasks = tasks.filter((t) => t.column_id === destColId);
    const sourceColTasks = tasks.filter((t) => t.column_id === sourceColId);

    const taskToMove = tasks.find((t) => t.id === draggableId);
    if (!taskToMove) return;

    let allDestTaskIds = [];

    if (sourceColId === destColId) {
      const items = Array.from(destColTasks);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      allDestTaskIds = items.map((i) => i.id);
    } else {
      const destItems = Array.from(destColTasks);
      destItems.splice(destination.index, 0, taskToMove);
      allDestTaskIds = destItems.map((i) => i.id);
    }

    onReorderTasks({
      taskId: draggableId,
      sourceColId,
      destColId,
      sourceIndex: source.index,
      destIndex: destination.index,
      allDestTaskIds,
    });
  };

  const handleCreateCol = (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    onCreateColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleSaveColTitle = (colId) => {
    if (editingColumnTitle.trim()) {
      onUpdateColumn(colId, { title: editingColumnTitle.trim() });
    }
    setEditingColumnId(null);
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-5 min-w-max pb-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((t) => t.column_id === column.id);

            return (
              <div
                key={column.id}
                className="w-80 sm:w-88 bg-slate-100/90 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col max-h-[calc(100vh-170px)] shadow-xs"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between gap-2 mb-3 px-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: column.color || '#3b82f6' }}
                    />
                    {editingColumnId === column.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingColumnTitle}
                        onChange={(e) => setEditingColumnTitle(e.target.value)}
                        onBlur={() => handleSaveColTitle(column.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveColTitle(column.id);
                          if (e.key === 'Escape') setEditingColumnId(null);
                        }}
                        className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-blue-500 w-full focus:outline-hidden"
                      />
                    ) : (
                      <h3
                        onClick={() => {
                          setEditingColumnId(column.id);
                          setEditingColumnTitle(column.title);
                        }}
                        className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-blue-600 transition"
                        title="Clique para renomear"
                      >
                        {column.title}
                      </h3>
                    )}
                    <span className="text-xs font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Menu da Coluna */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenColMenuId(openColMenuId === column.id ? null : column.id)
                      }
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openColMenuId === column.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenColMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fade-in text-xs">
                          <button
                            onClick={() => {
                              setEditingColumnId(column.id);
                              setEditingColumnTitle(column.title);
                              setOpenColMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Renomear Coluna
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir a coluna "${column.title}" e suas tarefas?`)) {
                                onDeleteColumn(column.id);
                              }
                              setOpenColMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-red-50 text-red-600 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir Coluna
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Botão Rápido de Adicionar Tarefa na Coluna */}
                <button
                  onClick={() => onNewTaskInColumn(column.id)}
                  className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 px-3 bg-white/70 hover:bg-white text-slate-700 hover:text-blue-600 text-xs font-semibold rounded-xl border border-dashed border-slate-300 hover:border-blue-400 shadow-2xs hover:shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Tarefa
                </button>

                {/* Área de Soltar Cards (Droppable) */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto space-y-2.5 pr-1 transition-colors rounded-xl ${
                        snapshot.isDraggingOver ? 'bg-blue-50/60 ring-2 ring-blue-400 ring-dashed' : ''
                      }`}
                      style={{ minHeight: '120px' }}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <TaskCard
                              task={task}
                              users={users}
                              onOpenTask={onOpenTask}
                              provided={provided}
                              isDragging={snapshot.isDragging}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-400">
                          <p className="text-xs">Nenhuma tarefa nesta coluna</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {/* Adicionar Nova Coluna / Bucket */}
          <div className="w-80 shrink-0">
            {isAddingColumn ? (
              <form
                onSubmit={handleCreateCol}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md animate-fade-in"
              >
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Nova Coluna (Bucket)
                </h4>
                <input
                  type="text"
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Ex: Em Testes, Aguardando Cliente..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden mb-3"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Adicionar Coluna
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-100/70 hover:bg-slate-200/80 text-slate-700 text-sm font-semibold rounded-2xl border border-dashed border-slate-300 transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Coluna / Seção
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
