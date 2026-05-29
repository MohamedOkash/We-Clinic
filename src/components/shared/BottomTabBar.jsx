import { 
  Menu, Users, Activity, ScanLine, Sparkles, Package, Pill, MessageSquare, 
  FileText, UserPlus, Calendar, LayoutDashboard, AlertTriangle, Building2, 
  Settings, UploadCloud, FolderOpen, Bot, Bell, User 
} from 'lucide-react';
import { useClinic } from '../../contexts/ClinicContext';

const TAB_CONFIG = {
  doctor: [
    { page: 'registry',       label: 'Patients',       labelAr: 'المرضى',         icon: Users },
    { page: 'examination',    label: 'Consultation',   labelAr: 'الكشف',          icon: Activity },
    { page: 'labOrders',      label: 'Investigations',  labelAr: 'الفحوصات',       icon: ScanLine },
    { page: 'aiPrescription', label: 'Prescription',   labelAr: 'الروشتة',        icon: Sparkles },
  ],
  pharmacy: [
    { page: 'pos',            label: 'POS',            labelAr: 'نقطة بيع',       icon: Package },
    { page: 'prescriptions',  label: 'Dispense',       labelAr: 'صرف الروشتة',     icon: Pill },
    { page: 'inventory',      label: 'Inventory',      labelAr: 'المخزون',        icon: Package },
    { page: 'inquiries',      label: 'Inquiries',      labelAr: 'الاستفسارات',     icon: MessageSquare },
  ],
  receptionist: [
    { page: 'register',       label: 'Register',       labelAr: 'تسجيل',          icon: UserPlus },
    { page: 'search',         label: 'Waiting Queue',  labelAr: 'الطابور',        icon: Users },
    { page: 'appointments',   label: 'Book Appt',      labelAr: 'حجز موعد',       icon: Calendar },
    { page: 'account',        label: 'Account',        labelAr: 'الحساب',         icon: Settings }
  ],
  radiology: [
    { page: 'orders',         label: 'Orders',         labelAr: 'الطلبات',        icon: ScanLine },
    { page: 'upload',         label: 'Upload',         labelAr: 'الرفع',          icon: UploadCloud },
    { page: 'history',        label: 'Archive',        labelAr: 'الأرشيف',        icon: FolderOpen },
    { page: 'account',        label: 'Account',        labelAr: 'الحساب',         icon: Settings }
  ],
  patient: [
    { page: 'home',           label: 'Dashboard',      labelAr: 'لوحتي',          icon: LayoutDashboard },
    { page: 'ai',             label: 'AI Helper',      labelAr: 'طبيب الـ AI',    icon: Bot },
    { page: 'book',           label: 'Book',           labelAr: 'حجز موعد',       icon: Calendar },
    { page: 'alarms',         label: 'Alarms',         labelAr: 'المنبهات',       icon: Bell },
  ],
  manager: [
    { page: 'dashboard',      label: 'Dashboard',      labelAr: 'الرئيسية',       icon: LayoutDashboard },
    { page: 'patients',       label: 'Patients',       labelAr: 'المرضى',         icon: Users },
    { page: 'inventory',      label: 'Inventory',      labelAr: 'المخازن',        icon: AlertTriangle },
    { page: 'account',        label: 'Account',        labelAr: 'الحساب',         icon: Settings }
  ],
  admin: [
    { page: 'organizations',  label: 'Facilities',     labelAr: 'المنشآت',        icon: Building2 },
    { page: 'users',          label: 'Users',          labelAr: 'المستخدمين',      icon: Users },
    { page: 'patients',       label: 'Patients',       labelAr: 'المرضى',         icon: User },
    { page: 'inventory',      label: 'Inventory',      labelAr: 'الأدوية',        icon: Pill }
  ]
};

export default function BottomTabBar({ onMoreClick }) {
  const { role, activePage, setActivePage, isAr } = useClinic();
  const tabs = TAB_CONFIG[role] || TAB_CONFIG['doctor'];

  return (
    <div className="fixed bottom-0 inset-x-0 h-16 bg-emerald-50/95 dark:bg-emerald-950/95 backdrop-blur-2xl border-t border-emerald-500/10 dark:border-emerald-400/10 flex items-center justify-around z-40 md:hidden select-none pb-safe">
      {tabs.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.page;
        return (
          <button
            key={item.page}
            onClick={() => setActivePage(item.page)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95
              ${isActive ? 'text-emerald-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Icon className="w-5.5 h-5.5" />
            <span className="text-[10px] font-black tracking-tight">{isAr ? item.labelAr : item.label}</span>
          </button>
        );
      })}

      {/* 5th Tab: More Button */}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 dark:text-slate-400 active:scale-95"
      >
        <Menu className="w-5.5 h-5.5" />
        <span className="text-[10px] font-black tracking-tight">{isAr ? 'المزيد' : 'More'}</span>
      </button>
    </div>
  );
}
