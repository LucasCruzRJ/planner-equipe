// Funções utilitárias para o Planner de Equipe

export function formatDueDate(dateString) {
  if (!dateString) return null;

  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    if (diffDays < 0) {
      return {
        text: `Atrasada (${formatted})`,
        status: 'overdue',
        days: diffDays,
      };
    } else if (diffDays === 0) {
      return {
        text: 'Vence Hoje',
        status: 'today',
        days: 0,
      };
    } else if (diffDays === 1) {
      return {
        text: 'Amanhã',
        status: 'tomorrow',
        days: 1,
      };
    } else if (diffDays <= 7) {
      return {
        text: `${formatted} (${diffDays}d)`,
        status: 'soon',
        days: diffDays,
      };
    } else {
      return {
        text: formatted,
        status: 'future',
        days: diffDays,
      };
    }
  } catch {
    return { text: dateString, status: 'future', days: 99 };
  }
}

export function getPriorityMeta(priority) {
  switch (priority) {
    case 'urgente':
      return {
        label: 'Urgente',
        color: 'bg-red-500 text-white',
        badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
        dot: 'bg-red-500',
      };
    case 'alta':
      return {
        label: 'Alta',
        color: 'bg-orange-500 text-white',
        badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    case 'media':
      return {
        label: 'Média',
        color: 'bg-blue-500 text-white',
        badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'baixa':
    default:
      return {
        label: 'Baixa',
        color: 'bg-slate-500 text-white',
        badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
        dot: 'bg-slate-400',
      };
  }
}

export function getUserInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
