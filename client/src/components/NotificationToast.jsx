import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function NotificationToast({ notifications }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none max-w-sm w-full">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 animate-fade-in text-xs"
        >
          {notif.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : notif.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="flex-1 font-medium leading-tight">{notif.message}</span>
        </div>
      ))}
    </div>
  );
}
