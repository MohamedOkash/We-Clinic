import React from 'react';

export function EmptyState({ 
  icon: Icon, 
  title = '', 
  message = '', 
  actionLabel = '', 
  onActionClick = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-14 bg-blue-500/5 dark:bg-slate-900/20 border border-blue-500/10 dark:border-slate-800/40 rounded-3xl gap-4 max-w-md mx-auto select-none">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-slate-800/50 flex items-center justify-center text-blue-600 dark:text-cyan-400 border border-blue-500/10 dark:border-slate-800/50 shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div className="space-y-1">
        {title && <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{title}</h3>}
        {message && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-[280px]">{message}</p>}
      </div>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="mt-2 h-10 px-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all border border-white/10 keep-text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
