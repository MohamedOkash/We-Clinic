import { X } from 'lucide-react';
import { useClinic } from '../../contexts/ClinicContext';

export default function BottomSheet({ isOpen, title, onClose, children, fullScreen = false }) {
  const { isAr } = useClinic();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div
        className={`w-full md:max-w-2xl h-[88vh] md:h-auto md:max-h-[85vh] bg-slate-55 dark:bg-[#0b0f1d]/90 text-slate-800 dark:text-slate-100 border-t md:border border-slate-200/60 dark:border-white/10 shadow-2xl rounded-t-[2.5rem] md:rounded-3xl flex flex-col min-h-0 overflow-hidden animate-slide-up-sheet md:animate-fade-scale backdrop-blur-3xl
          ${fullScreen ? 'md:max-w-none md:w-full md:h-full md:max-h-none md:rounded-none' : ''}`}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300/40 dark:bg-white/10 rounded-full mx-auto my-3 md:hidden shrink-0" />

        {/* Header */}
        <div className="px-6 pb-4 md:py-5 flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 bg-white/[0.02] shrink-0">
          <h3 className="font-black text-lg md:text-xl text-slate-900 dark:text-white truncate">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-200/50 dark:bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-slate-500 dark:text-slate-400 rounded-full transition-all duration-200 shrink-0 ms-2 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 min-h-0 bg-white/[0.01] pb-8 md:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
