import { X, Sun, Moon, Globe, LogOut, Lock, Building2 } from 'lucide-react';
import { useClinic } from '../../contexts/ClinicContext';

export default function MobileDrawer({ isOpen, onClose, onOpenSettings }) {
  const { role, isAr, t, loggedUser, handleLogout, theme, setTheme, lang, setLang, currentOrganization } = useClinic();
  const isDark = theme !== 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex md:hidden animate-fade-in">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Drawer content panel */}
      <div 
        className={`relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#0b0f1d]/95 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl flex flex-col p-5 select-none transition-transform duration-300
          ${isAr ? 'ms-auto border-s animate-slide-in-right' : 'me-auto border-e animate-slide-in-left'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
          <span className="font-black text-slate-900 dark:text-slate-50 text-lg tracking-tight">{t('appTitle')}</span>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-500/10 hover:bg-red-500/20 hover:text-red-500 text-slate-500 dark:text-slate-400 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="py-5 border-b border-slate-200 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white keep-text-white flex items-center justify-center font-black border border-blue-300/20 shadow-sm shrink-0">
            {(loggedUser?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-950 dark:text-slate-50 text-base truncate">
              {isAr ? loggedUser?.nameAr : loggedUser?.name}
            </h4>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t(role)}
            </span>
          </div>
        </div>

        {/* Clinic / Facility Info */}
        {role !== 'admin' && currentOrganization && (
          <div className="py-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-slate-200 text-xs truncate">
              {isAr ? currentOrganization.nameAr : currentOrganization.name}
            </span>
          </div>
        )}

        {/* Actions / Settings List */}
        <div className="flex-1 py-4 flex flex-col gap-3 overflow-y-auto">
          {role !== 'admin' && (
            <button 
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm text-slate-800 dark:text-slate-400 hover:bg-slate-500/10 hover:text-slate-950 dark:hover:text-slate-50 transition-colors w-full"
            >
              <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>{isAr ? 'إعدادات الحساب' : 'Account Settings'}</span>
            </button>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex-1 p-3 bg-slate-500/5 hover:bg-slate-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-slate-500/10 dark:border-white/5 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs"
            >
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-violet-600" />}
              <span>{isDark ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</span>
            </button>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex-1 p-3 bg-slate-500/5 hover:bg-slate-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-slate-500/10 dark:border-white/5 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs"
            >
              <Globe className="w-4.5 h-4.5 text-slate-600 dark:text-slate-400" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              handleLogout();
            }}
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-all font-bold text-sm border border-red-500/20"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
