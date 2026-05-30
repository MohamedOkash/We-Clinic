import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title = '',
  message = '',
  onConfirm,
  onCancel,
  danger = false,
  confirmText = '',
  cancelText = '',
  isAr = true
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const btnConfirmClass = danger
    ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg border border-red-500/30'
    : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg border border-emerald-400/20';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-black text-white leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700/50"
          >
            {cancelText || (isAr ? 'إلغاء' : 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-xs font-bold transition-all active:scale-[0.98] hover:brightness-110 keep-text-white ${btnConfirmClass}`}
          >
            {confirmText || (isAr ? 'تأكيد' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
