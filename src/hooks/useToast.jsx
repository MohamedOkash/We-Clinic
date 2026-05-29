import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

// ─── Hook ─────────────────────────────────────────────────────────────────────
let _addToast = null;

export function useToast() {
  const toast = useCallback((msg, type = 'success') => {
    if (_addToast) _addToast(msg, type);
  }, []);
  return {
    success: (msg) => toast(msg, 'success'),
    error:   (msg) => toast(msg, 'error'),
    info:    (msg) => toast(msg, 'info'),
  };
}

// ─── Provider / Renderer ──────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (msg, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { _addToast = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error:   <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info:    <Info        className="w-5 h-5 text-cyan-400 shrink-0" />,
  };
  const colors = {
    success: 'border-emerald-500/40 bg-emerald-900/30',
    error:   'border-red-500/40     bg-red-900/30',
    info:    'border-cyan-500/40    bg-cyan-900/20',
  };

  return (
    <div className="fixed bottom-6 end-6 z-[200] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-white font-bold text-sm pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1 leading-snug">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-white p-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
