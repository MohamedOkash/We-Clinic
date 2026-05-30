import React from 'react';

export function EmptyState({ 
  icon: Icon, 
  title = '', 
  message = '', 
  actionLabel = '', 
  onActionClick = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-14 bg-emerald-500/5 dark:bg-slate-900/20 border border-emerald-500/10 dark:border-slate-800/40 rounded-3xl gap-4 max-w-md mx-auto select-none">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-slate-800/50 flex items-center justify-center text-emerald-600 dark:text-cyan-400 border border-emerald-500/10 dark:border-slate-800/50 shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div className="space-y-1">
        {title && <h3 className="text-lg font-black text-emerald-950 dark:text-white leading-tight">{title}</h3>}
        {message && <p className="text-xs text-emerald-800/70 dark:text-slate-400 leading-relaxed font-semibold max-w-[280px]">{message}</p>}
      </div>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="mt-2 h-10 px-5 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all border border-emerald-400/20 keep-text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
