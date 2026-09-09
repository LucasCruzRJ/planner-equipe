import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { getPriorityMeta } from '../utils/helpers';

export function CalendarView({ tasks, onOpenTask, onNewTaskWithDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Mapear tarefas por data 'YYYY-MM-DD'
  const tasksByDate = {};
  for (const t of tasks) {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
      tasksByDate[t.due_date].push(t);
    }
  }

  // Montar células do grid
  const calendarCells = [];
  // Células vazias do mês anterior
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ type: 'empty', key: `prev-${i}` });
  }
  // Dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    calendarCells.push({
      type: 'day',
      day,
      dateStr,
      isToday,
      tasks: tasksByDate[dateStr] || [],
      key: `day-${day}`,
    });
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Cabeçalho do Calendário */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              {monthNames[month]} de {year}
            </h2>
            <button
              onClick={goToToday}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 text-center py-2">
          {weekDays.map((wd, i) => (
            <div key={i} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
          {calendarCells.map((cell) => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="bg-slate-50/40 min-h-[100px] p-2" />;
            }

            return (
              <div
                key={cell.key}
                onClick={() => onNewTaskWithDate(cell.dateStr)}
                className={`min-h-[100px] p-2 hover:bg-blue-50/20 cursor-pointer transition flex flex-col group ${
                  cell.isToday ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Número do Dia */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      cell.isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 group-hover:text-blue-600'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewTaskWithDate(cell.dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition"
                    title="Adicionar tarefa neste dia"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Lista de Tarefas do Dia */}
                <div className="space-y-1 overflow-y-auto flex-1 max-h-24">
                  {cell.tasks.map((task) => {
                    const priorityMeta = getPriorityMeta(task.priority);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTask(task);
                        }}
                        className="text-[11px] p-1.5 rounded-md bg-white border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition flex items-center gap-1.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityMeta.dot}`} />
                        <span className="truncate font-medium text-slate-800">{task.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
