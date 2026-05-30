import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LogOut, Globe, Activity, Users, Package, ScanLine, User, LayoutDashboard,
  Building2, Sun, Moon, Sparkles, Pill, MessageSquare, FileText, Calendar,
  UploadCloud, FolderOpen, Bot, Bell, AlertTriangle, Menu, X, UserPlus, Lock, Shield, Settings, Search
} from 'lucide-react';
import { ClinicProvider, useClinic } from './contexts/ClinicContext';
import { ToastContainer } from './hooks/useToast';
import { GlassModal, Input } from './components/shared';
import NotificationBell from './components/NotificationCenter';

// Lazy load views for bundle size optimization
const AuthView         = lazy(() => import('./views/AuthView'));
const ReceptionistView = lazy(() => import('./views/ReceptionistView'));
const DoctorWorkspace  = lazy(() => import('./views/DoctorWorkspace'));
const PharmacyView     = lazy(() => import('./views/PharmacyView'));
const RadiologyView    = lazy(() => import('./views/RadiologyView'));
const PatientPortal    = lazy(() => import('./views/PatientPortal'));
const ManagerView      = lazy(() => import('./views/ManagerView'));
const AdminView        = lazy(() => import('./views/AdminView'));
const AccountSettingsView = lazy(() => import('./views/AccountSettingsView'));

import LoadingSpinner from './components/shared/LoadingSpinner';

// Responsive Components
import MobileDrawer from './components/shared/MobileDrawer';
import BottomTabBar from './components/shared/BottomTabBar';
import { useBreakpoint } from './hooks/useBreakpoint';

// Shared Router Components
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';

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
  const { role, activePage, isAr, t, loggedUser, handleLogout, theme, setTheme, lang, setLang } = useClinic();
  const navigate = useNavigate();
  const isDark = theme !== 'light';
  const menuItems = SIDEBAR_ITEMS[role] || [];

  return (
    <aside 
      className="hidden md:flex flex-col h-full bg-emerald-50/90 dark:bg-emerald-950/20 backdrop-blur-3xl border-e border-emerald-500/10 dark:border-emerald-400/10 transition-all duration-300 z-50 select-none group w-16 lg:w-64 hover:w-64"
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-emerald-500/10 dark:border-emerald-400/10 overflow-hidden shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center border border-emerald-300/30 shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0">
          <Activity className="w-4 h-4 text-white keep-text-white" />
        </div>
        <span className="font-black text-emerald-900 dark:text-emerald-50 text-base lg:block group-hover:block hidden tracking-tight whitespace-nowrap">{t('appTitle')}</span>
      </div>

      {/* User profile section */}
      <div className="p-4 border-b border-emerald-500/10 dark:border-emerald-400/10 flex items-center justify-between gap-3 overflow-hidden shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white keep-text-white flex items-center justify-center font-black border border-emerald-300/20 shadow-sm shrink-0">
            {(loggedUser?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 lg:block group-hover:block hidden">
            <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-xs truncate">{isAr ? loggedUser?.nameAr : loggedUser?.name}</h4>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t(role)}</span>
          </div>
        </div>
        {role !== 'account' && role !== 'admin' && (
          <button 
            onClick={onOpenSettings}
            className="p-1.5 text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-50 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 dark:border-white/5 transition-all shrink-0 lg:block group-hover:block hidden"
            title={isAr ? 'إعدادات الحساب' : 'Account Settings'}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 scrollbar-thin">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => navigate(`/${role}/${item.page}`)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-black text-xs transition-all duration-200 select-none justify-center lg:justify-start group-hover:justify-start
                ${isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/10 dark:shadow-none keep-text-white' 
                  : 'text-emerald-800 dark:text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-950 dark:hover:text-emerald-50'}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white keep-text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span className="lg:inline group-hover:inline hidden whitespace-nowrap">{isAr ? item.labelAr : item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-emerald-500/10 dark:border-emerald-400/10 flex flex-col gap-2 shrink-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-1">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex-1 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-emerald-500/10 dark:border-white/5 text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold text-[10px]"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-violet-600" />}
            <span className="lg:inline group-hover:inline hidden">{isDark ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</span>
          </button>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex-1 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-black/30 dark:hover:bg-white/5 border border-emerald-500/10 dark:border-white/5 text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold text-[10px]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="lg:inline group-hover:inline hidden">{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start group-hover:justify-start gap-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 dark:hover:bg-red-50 dark:hover:text-white rounded-lg transition-all font-bold text-xs border border-red-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="lg:inline group-hover:inline hidden whitespace-nowrap">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Top Navbar Component ──────────────────────────────────────────────────────
function TopNav() {
  const { t, isAr, currentOrganization, setIsMenuOpen, isMenuOpen, activePage, role } = useClinic();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install outcome: ${outcome}`);
    setDeferredPrompt(null);
  };
  
  const items = SIDEBAR_ITEMS[role] || [];
  const currentItem = items.find(item => item.page === activePage);
  const pageTitle = currentItem ? (isAr ? currentItem.labelAr : currentItem.label) : '';

  return (
    <header className="bg-white/70 dark:bg-[#07130f]/60 backdrop-blur-2xl border-b border-emerald-500/10 dark:border-emerald-400/10 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-emerald-800 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h3 className="font-black text-emerald-900 dark:text-white text-lg tracking-tight md:hidden">
          {t('appTitle')}
        </h3>
        <h3 className="font-black text-emerald-900 dark:text-white text-xl tracking-tight hidden md:block">
          {pageTitle}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-bold text-xs shadow-md border border-fuchsia-400/30 animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer keep-text-white"
          >
            <span>🏥</span>
            <span>{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
          </button>
        )}

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
  const { role, activePage, isAr } = useClinic();
  
  let component;
  if (activePage === 'account') {
    component = <AccountSettingsView />;
  } else {
    switch (role) {
      case 'receptionist': component = <ReceptionistView />; break;
      case 'doctor':       component = <DoctorWorkspace />; break;
      case 'pharmacy':     component = <PharmacyView />; break;
      case 'radiology':    component = <RadiologyView />; break;
      case 'patient':      component = <PatientPortal />; break;
      case 'manager':      component = <ManagerView />; break;
      case 'admin':        component = <AdminView />; break;
      default:             component = <DoctorWorkspace />;
    }
  }

  return (
    <Suspense fallback={<LoadingSpinner message={isAr ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard workspace...'} />}>
      {component}
    </Suspense>
  );
}

// ─── RoleLayout Wrapper for synced route matching ──────────────────────────────
function RoleLayout() {
  const { rolePath, tabPath } = useParams();
  const { role, activePage, setActivePage, isLoggedIn, isMenuOpen, setIsMenuOpen, patients, handleLogout, isAr, t } = useClinic();
  const navigate = useNavigate();
  const lastSyncedPage = useRef('');

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Role verification: user can't access a route of a different role
  useEffect(() => {
    if (isLoggedIn && rolePath && rolePath !== role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [rolePath, role, isLoggedIn, navigate]);

  // 2. Sync URL tab parameter with context activePage in a single, stable effect
  useEffect(() => {
    if (!role) return;

    const defaultPage = role === 'doctor' ? 'registry'
                      : role === 'pharmacy' ? 'pos'
                      : role === 'receptionist' ? 'register'
                      : role === 'radiology' ? 'orders'
                      : role === 'patient' ? 'home'
                      : 'dashboard';

    if (!tabPath) {
      navigate(`/${role}/${defaultPage}`, { replace: true });
      lastSyncedPage.current = defaultPage;
      setActivePage(defaultPage);
      return;
    }

    if (tabPath !== lastSyncedPage.current) {
      lastSyncedPage.current = tabPath;
      setActivePage(tabPath);
    } else if (activePage !== tabPath) {
      lastSyncedPage.current = activePage;
      navigate(`/${role}/${activePage}`, { replace: true });
    }
  }, [tabPath, activePage, role, navigate, setActivePage]);

  // 4. Keyboard Shortcuts: Ctrl+K / Ctrl+N / Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (['receptionist', 'doctor', 'admin', 'manager'].includes(role)) {
          navigate(`/${role}/${role === 'doctor' ? 'registry' : role === 'receptionist' ? 'register' : 'patients'}`);
        }
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, navigate]);

  // Filter Patients
  const filteredPatients = searchQuery.trim() === '' ? [] : patients.filter(p => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query) || false;
    const nameArMatch = p.nameAr?.includes(query) || false;
    const phoneMatch = p.phone?.includes(query) || false;
    return nameMatch || nameArMatch || phoneMatch;
  });

  // Filter Pages (from SIDEBAR_ITEMS[role])
  const rolePages = SIDEBAR_ITEMS[role] || [];
  const filteredPages = searchQuery.trim() === '' ? rolePages.slice(0, 4) : rolePages.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(query) || item.labelAr.includes(query);
  });

  // Filter Actions
  const allActions = [
    {
      id: 'book',
      label: 'Book Appointment',
      labelAr: 'حجز موعد جديد',
      shortcut: 'Ctrl+N',
      execute: () => navigate(`/${role}/${role === 'receptionist' ? 'appointments' : role === 'patient' ? 'book' : 'registry'}`)
    },
    {
      id: 'settings',
      label: 'Account Settings',
      labelAr: 'إعدادات الحساب',
      execute: () => navigate(`/${role}/account`)
    },
    {
      id: 'logout',
      label: 'System Logout',
      labelAr: 'تسجيل الخروج من النظام',
      execute: handleLogout
    }
  ];
  const filteredActions = searchQuery.trim() === '' ? allActions : allActions.filter(action => {
    const query = searchQuery.toLowerCase();
    return action.label.toLowerCase().includes(query) || action.labelAr.includes(query);
  });

  const handlePatientSelect = (p) => {
    setIsCommandPaletteOpen(false);
    if (role === 'doctor') {
      navigate(`/doctor/registry`);
    } else if (role === 'receptionist') {
      navigate(`/receptionist/search`);
    } else {
      navigate(`/${role}/patients`);
    }
  };

  return (
    <div className="min-h-screen md:h-screen w-screen flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative pb-16 md:pb-0">
      <Background />
      {/* Collapsible Sidebar (Tablet/Desktop) */}
      <Sidebar onOpenSettings={() => navigate(`/${role}/account`)} />
      
      {/* Mobile personal overlay drawer */}
      <MobileDrawer 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenSettings={() => navigate(`/${role}/account`)} 
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-visible md:overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-visible md:overflow-y-auto p-3 md:p-4 min-h-0">
          <RoleView />
        </main>
      </div>

      {/* Mobile bottom tab navigation */}
      <BottomTabBar onMoreClick={() => setIsMenuOpen(true)} />

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/40">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث عن مرضى، صفحات، أو خدمات... (Esc للإغلاق)' : 'Search patients, pages, or services... (Esc to close)'}
                className="w-full bg-transparent text-white border-0 outline-none text-sm placeholder-slate-500 font-bold"
              />
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black border border-slate-700/50 shrink-0">ESC</span>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[45vh] scrollbar-thin">
              
              {/* 1. Patient Matches */}
              {filteredPatients.length > 0 && (
                <div>
                  <h4 className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/40 pb-1 mb-1.5">
                    {isAr ? 'المرضى المطابقون' : 'Matching Patients'}
                  </h4>
                  <div className="space-y-1">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handlePatientSelect(p)}
                        className="w-full text-start px-3 py-2 hover:bg-slate-800/60 rounded-xl flex justify-between items-center transition-all border border-transparent hover:border-slate-800/40 text-sm group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{isAr ? p.nameAr : p.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.phone}</p>
                        </div>
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-2.5 py-0.5 rounded-full font-black">
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Navigation Shortcuts */}
              {filteredPages.length > 0 && (
                <div>
                  <h4 className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/40 pb-1 mb-1.5">
                    {isAr ? 'التنقل السريع' : 'Navigation Shortcuts'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {filteredPages.map(item => {
                      const Icon = item.icon || Activity;
                      return (
                        <button
                          key={item.page}
                          onClick={() => {
                            setIsCommandPaletteOpen(false);
                            navigate(`/${role}/${item.page}`);
                          }}
                          className="text-start px-3 py-2.5 hover:bg-slate-800/60 rounded-xl flex items-center gap-2.5 transition-all text-xs border border-transparent hover:border-slate-800/40 text-white font-bold group"
                        >
                          <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{isAr ? item.labelAr : item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Global Actions */}
              {filteredActions.length > 0 && (
                <div>
                  <h4 className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/40 pb-1 mb-1.5">
                    {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
                  </h4>
                  <div className="space-y-1">
                    {filteredActions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          action.execute();
                        }}
                        className="w-full text-start px-3 py-2.5 hover:bg-slate-800/60 rounded-xl flex items-center justify-between transition-all text-xs border border-transparent hover:border-slate-800/40 text-white font-bold group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 rounded bg-slate-800 text-cyan-400 shrink-0">⚡</span>
                          <span>{isAr ? action.labelAr : action.label}</span>
                        </div>
                        {action.shortcut && (
                          <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                            {action.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPatients.length === 0 && filteredPages.length === 0 && filteredActions.length === 0 && (
                <div className="text-center py-6 text-slate-500 font-bold text-xs">
                  {isAr ? 'لا توجد نتائج مطابقة لبحثك 🔍' : 'No matching results found 🔍'}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

// ─── HomeRedirect component ──────────────────────────────────────────────────
function HomeRedirect() {
  const { isLoggedIn, role, activePage } = useClinic();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const defaultPage = role === 'doctor' ? 'registry'
                    : role === 'pharmacy' ? 'pos'
                    : role === 'receptionist' ? 'register'
                    : role === 'radiology' ? 'orders'
                    : role === 'patient' ? 'home'
                    : 'dashboard';

  const tab = activePage || defaultPage;
  return <Navigate to={`/${role}/${tab}`} replace />;
}

// ─── Inner App ────────────────────────────────────────────────────────────────
function InnerApp() {
  const { isLoggedIn, isAuthLoading } = useClinic();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isAuthLoading) {
    return <LoadingSpinner message={document.documentElement.lang === 'ar' ? 'جاري التحقق من الهوية...' : 'Verifying identity...'} />;
  }

  return (
    <>
      {isOffline && (
        <div className="bg-yellow-500 text-slate-950 font-bold text-xs text-center py-2 px-4 z-[999] shrink-0 select-none border-b border-yellow-600/40 w-full">
          ⚠️ {document.documentElement.lang === 'ar' ? 'أنت تعمل حالياً في وضع عدم الاتصال (أوفلاين) - بعض الميزات قد لا تكون متوفرة' : 'You are currently offline - some features might be unavailable'}
        </div>
      )}
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={
          !isLoggedIn ? (
            <div className="min-h-screen w-screen overflow-y-auto relative flex flex-col justify-center bg-[#f0f7f4] dark:bg-[#030806]">
              <Background />
              <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
                <AuthView />
              </Suspense>
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['receptionist', 'doctor', 'pharmacy', 'radiology', 'patient', 'manager', 'admin']} />}>
          <Route path="/:rolePath" element={<RoleLayout />} />
          <Route path="/:rolePath/:tabPath" element={<RoleLayout />} />
        </Route>

        {/* Home redirect */}
        <Route path="/" element={<HomeRedirect />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ClinicProvider>
          <InnerApp />
        </ClinicProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
