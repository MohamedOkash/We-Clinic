import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

let _addToast = null;

export function useToast() {
  const toast = useCallback((msg, type = 'success') => {
    if (_addToast) _addToast(msg, type);
  }, []);

  return {
    success: (msg) => toast(msg, 'success'),
    error:   (msg) => toast(msg, 'error'),
    warning: (msg) => toast(msg, 'warning'),
    info:    (msg) => toast(msg, 'info'),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (msg, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
    return () => { _addToast = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error:   <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info:    <Info        className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  const colors = {
    success: 'border-emerald-500/40 bg-slate-900/95 shadow-emerald-950/20 text-white',
    error:   'border-red-500/40     bg-slate-900/95 shadow-red-950/20     text-white',
    warning: 'border-amber-500/40   bg-slate-900/95 shadow-amber-950/20   text-white',
    info:    'border-cyan-500/40    bg-slate-900/95 shadow-cyan-950/20    text-white',
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    warning: 'bg-amber-500',
    info:    'bg-cyan-500',
  };

  return (
    <div className="fixed bottom-6 end-6 z-[250] flex flex-col gap-3 pointer-events-none w-full max-w-[360px]">
      {/* Self-contained styling for custom shrink keyframes */}
      <style>{`
        @keyframes toastShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      {toasts.map(t => (
        <div
          key={t.id}
          className={`relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl text-white font-bold text-sm pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1 leading-snug pe-4">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-white p-1 shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>
          {/* Progress Bar */}
          <div 
            className={`absolute bottom-0 right-0 h-[3px] ${progressColors[t.type]}`} 
            style={{ animation: 'toastShrink 4000ms linear forwards' }}
          />
        </div>
      ))}
    </div>
  );
}
