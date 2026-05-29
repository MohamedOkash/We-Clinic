import { useState } from 'react';
import {
  LogOut, Globe, Activity, Users, Package, ScanLine, User, LayoutDashboard,
  Building2, Sun, Moon, Sparkles, Pill, MessageSquare, FileText, Calendar,
  UploadCloud, FolderOpen, Bot, Bell, AlertTriangle, Menu, X, UserPlus, Lock, Shield, Settings
} from 'lucide-react';
import { ClinicProvider, useClinic } from './contexts/ClinicContext';
import { ToastContainer, useToast } from './hooks/useToast';
import { GlassModal, Input, s } from './components/shared';
import NotificationBell from './components/NotificationCenter';
import AuthView         from './views/AuthView';
import ReceptionistView from './views/ReceptionistView';
import DoctorWorkspace  from './views/DoctorWorkspace';
import PharmacyView     from './views/PharmacyView';
import RadiologyView    from './views/RadiologyView';
import PatientPortal    from './views/PatientPortal';
import ManagerView      from './views/ManagerView';
import AdminView        from './views/AdminView';
import AccountSettingsView from './views/AccountSettingsView';

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
  const { theme } = useClinic();
  const isDark = theme !== 'light';

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#030806]' : 'bg-[#f0f7f4]'}`}>
      <div className="absolute top-[-20%] start-[-10%] w-[80vw] h-[80vw] max-w-3xl max-h-3xl rounded-full"
        style={{ background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] end-[-10%] w-[80vw] h-[80vw] max-w-3xl max-h-3xl rounded-full"
        style={{ background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-2xl max-h-2xl rounded-full"
        style={{ background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.02) 0%, transparent 70%)' }} />
      <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'}`}
        style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}

// ─── Role Config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  receptionist: { icon: Users,          colorFrom: 'from-teal-500',   colorTo: 'to-cyan-700'    },
  doctor:       { icon: Activity,        colorFrom: 'from-emerald-500', colorTo: 'to-teal-700'  },
  pharmacy:     { icon: Package,         colorFrom: 'from-amber-500',  colorTo: 'to-orange-700'  },
  radiology:    { icon: ScanLine,        colorFrom: 'from-purple-500', colorTo: 'to-violet-700'  },
  patient:      { icon: User,            colorFrom: 'from-cyan-500',   colorTo: 'to-blue-700'    },
  manager:      { icon: LayoutDashboard, colorFrom: 'from-slate-500',  colorTo: 'to-slate-700'   },
  admin:        { icon: Building2,       colorFrom: 'from-cyan-500',   colorTo: 'to-blue-700'    },
};

const SIDEBAR_ITEMS = {
  doctor: [
    { page: 'registry',       label: 'Patients Registry',   labelAr: 'سجل المرضى',          icon: Users },
    { page: 'examination',    label: 'Exam & Diagnosis',    labelAr: 'غرفة الكشف والأعراض',  icon: Activity },
    { page: 'labOrders',      label: 'Lab & Scan Orders',   labelAr: 'طلبات الفحوصات والأشعة', icon: ScanLine },
    { page: 'aiPrescription', label: 'AI Copilot & Rx',     labelAr: 'الروشتة والذكاء الاصطناعي', icon: Sparkles },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  pharmacy: [
    { page: 'pos',            label: 'Medication POS',      labelAr: 'بيع مباشر POS',      icon: Package },
    { page: 'prescriptions',  label: 'Rx Dispensing',      labelAr: 'صرف الروشتات',        icon: Pill },
    { page: 'inventory',      label: 'Medication Inventory', labelAr: 'مستودع الأدوية',       icon: Package },
    { page: 'inquiries',      label: 'Doctor Inquiries',    labelAr: 'استفسارات الأطباء',    icon: MessageSquare },
    { page: 'invoices',       label: 'Sales Invoices',      labelAr: 'سجل المبيعات',        icon: FileText },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  receptionist: [
    { page: 'register',       label: 'Patient Registration', labelAr: 'تسجيل مريض جديد',      icon: UserPlus },
    { page: 'search',         label: 'Waiting Queue Room',  labelAr: 'طابور الكشف الطبي',    icon: Users },
    { page: 'appointments',   label: 'Book Consultation',   labelAr: 'حجز المواعيد',         icon: Calendar },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  radiology: [
    { page: 'orders',         label: 'Incoming Orders',     labelAr: 'طلبات الفحوصات',      icon: ScanLine },
    { page: 'upload',         label: 'Upload Results',      labelAr: 'رفع التقارير والأشعة',  icon: UploadCloud },
    { page: 'history',        label: 'Scans Archive',       labelAr: 'أرشيف التحاليل والأشعة', icon: FolderOpen },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  patient: [
    { page: 'home',           label: 'Health Board',        labelAr: 'لوحتي الطبية',         icon: LayoutDashboard },
    { page: 'ai',             label: 'AI Health Companion', labelAr: 'طبيب الـ AI الفوري',   icon: Bot },
    { page: 'book',           label: 'Book Appointment',    labelAr: 'حجز موعد جديد',       icon: Calendar },
    { page: 'alarms',         label: 'Medication Alarms',   labelAr: 'منبه جرعات الدواء',     icon: Bell },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  manager: [
    { page: 'dashboard',      label: 'Executive Dashboard', labelAr: 'لوحة تحكم المدير',      icon: LayoutDashboard },
    { page: 'patients',       label: 'Patients List',       labelAr: 'سجل المرضى الكلي',     icon: Users },
    { page: 'inventory',      label: 'Inventory Alerts',    labelAr: 'تنبيهات المخازن',      icon: AlertTriangle },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ],
  admin: [
    { page: 'organizations',  label: 'Facilities Manager',  labelAr: 'المنشآت والجهات',      icon: Building2 },
    { page: 'users',          label: 'System Users',        labelAr: 'حسابات ومستخدمو النظام', icon: Users },
    { page: 'patients',       label: 'Patients Registry',   labelAr: 'سجل المرضى الكلي',     icon: User },
    { page: 'inventory',      label: 'Global Inventory',    labelAr: 'مستودع الأدوية العام', icon: Pill },
    { page: 'security',       label: 'Security Settings',   labelAr: 'إعدادات الأمان',       icon: Lock },
    { page: 'account',        label: 'Account Settings',    labelAr: 'إعدادات الحساب',       icon: Settings }
  ]
};

// ─── Sidebar Component ─────────────────────────────────────────────────────────
function Sidebar({ onOpenSettings }) {
  const { role, activePage, setActivePage, isAr, t, loggedUser, handleLogout, theme, setTheme, lang, setLang, isMenuOpen, setIsMenuOpen } = useClinic();
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG['doctor'];
  const isDark = theme !== 'light';
  const menuItems = SIDEBAR_ITEMS[role] || [];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed md:relative top-0 bottom-0 start-0 z-50 w-64 md:w-72 shrink-0 flex flex-col h-full bg-emerald-50/90 dark:bg-emerald-950/20 backdrop-blur-3xl border-e border-emerald-500/10 dark:border-emerald-400/10 transition-transform duration-300 md:translate-x-0
          ${isMenuOpen ? 'translate-x-0' : isAr ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-emerald-500/10 dark:border-emerald-400/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center border border-emerald-300/30 shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0">
              <Activity className="w-4 h-4 text-white keep-text-white" />
            </div>
            <span className="font-black text-emerald-900 dark:text-emerald-50 text-lg tracking-tight">{t('appTitle')}</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile section */}
        <div className="p-5 border-b border-emerald-500/10 dark:border-emerald-400/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white keep-text-white flex items-center justify-center font-black border border-emerald-300/20 shadow-sm shrink-0">
              {(loggedUser?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-sm truncate">{isAr ? loggedUser?.nameAr : loggedUser?.name}</h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t(role)}</span>
            </div>
          </div>
          {role !== 'admin' && (
            <button 
              onClick={onOpenSettings}
              className="p-2 text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-50 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 dark:border-white/5 transition-all shrink-0 animate-pulse"
              title={isAr ? 'إعدادات الحساب' : 'Account Settings'}
            >
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 scrollbar-thin">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => {
                  setActivePage(item.page);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm transition-all duration-200 select-none
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/10 dark:shadow-none keep-text-white' 
                    : 'text-emerald-800 dark:text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-950 dark:hover:text-emerald-50'}`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white keep-text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>{isAr ? item.labelAr : item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-emerald-500/10 dark:border-emerald-400/10 flex flex-col gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex-1 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-emerald-500/10 dark:border-white/5 text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs"
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-violet-600" />}
              <span>{isDark ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</span>
            </button>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex-1 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-emerald-500/10 dark:border-white/5 text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 dark:hover:bg-red-500/80 dark:hover:text-white rounded-xl transition-all font-bold text-sm border border-red-500/20"
          >
            <LogOut className="w-4 h-4 animate-pulse" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Top Navbar Component ──────────────────────────────────────────────────────
function TopNav() {
  const { t, isAr, currentOrganization, setIsMenuOpen, isMenuOpen, activePage, role } = useClinic();
  
  const items = SIDEBAR_ITEMS[role] || [];
  const currentItem = items.find(item => item.page === activePage);
  const pageTitle = currentItem ? (isAr ? currentItem.labelAr : currentItem.label) : '';

  return (
    <header className="bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-b border-emerald-500/10 dark:border-emerald-400/10 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-emerald-800 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h3 className="font-black text-emerald-900 dark:text-white text-lg tracking-tight">
          {pageTitle}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        {role === 'admin' ? (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 dark:border-cyan-400/20 min-w-0 shadow-inner">
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-black text-cyan-900 dark:text-cyan-100 text-xs truncate max-w-[200px]">
              {isAr ? 'إدارة النظام العام' : 'System Administration'}
            </span>
          </div>
        ) : currentOrganization && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 dark:bg-black/40 border border-emerald-500/10 dark:border-white/10 min-w-0">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
            <span className="font-black text-emerald-900 dark:text-white text-xs truncate max-w-[200px]">
              {isAr ? currentOrganization.nameAr : currentOrganization.name}
            </span>
          </div>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}

// ─── Role Router ─────────────────────────────────────────────────────────────
function RoleView() {
  const { role, activePage } = useClinic();
  if (activePage === 'account') {
    return <AccountSettingsView />;
  }
  switch (role) {
    case 'receptionist': return <ReceptionistView />;
    case 'doctor':       return <DoctorWorkspace />;
    case 'pharmacy':     return <PharmacyView />;
    case 'radiology':    return <RadiologyView />;
    case 'patient':      return <PatientPortal />;
    case 'manager':      return <ManagerView />;
    case 'admin':        return <AdminView />;
    default:             return <DoctorWorkspace />;
  }
}

// ─── Inner App ────────────────────────────────────────────────────────────────
function InnerApp() {
  const { isLoggedIn, setActivePage } = useClinic();

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen overflow-hidden relative">
        <Background />
        <AuthView />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      <Background />
      <Sidebar onOpenSettings={() => setActivePage('account')} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-hidden p-3 md:p-4">
          <RoleView />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ClinicProvider>
      <InnerApp />
    </ClinicProvider>
  );
}
