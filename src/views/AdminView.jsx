import { useState, useMemo } from 'react';
import { 
  Building2, Users, User, Plus, Trash2, Edit3, Save, Lock, Shield, 
  Search, CheckCircle, AlertCircle, Trash, Pill, RefreshCw, Settings,
  ChevronDown
} from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, Input, s, GlassModal } from '../components/shared';
import { useToast } from '../hooks/useToast';
import { SPECIALTIES } from '../constants';
import AccountSettingsView from './AccountSettingsView';

export default function AdminView() {
  const { 
    t, isAr, organizations, allUsers, patients, inventory,
    changeAdminPassword, changeUserPassword, addOrganization, deleteOrganization,
    adminCreateUser, adminUpdateUser, adminDeleteUser,
    updatePatient, updateMedication, deleteMedication,
    addMedication, activePage, setActivePage
  } = useClinic();

  const toast = useToast();
  
  // Tab State synced with global activePage (fallback to 'organizations' if not matching admin pages)
  const adminPages = ['organizations', 'users', 'patients', 'inventory', 'security', 'account'];
  const activeTab = adminPages.includes(activePage) ? activePage : 'organizations';
  const setActiveTab = (tab) => {
    setActivePage(tab);
  };
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);

  // Edit/Select states
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form Fields State (Organizations)
  const [orgForm, setOrgForm] = useState({
    name: '',
    nameAr: '',
    type: 'clinic',
    specialty: 'general',
    city: 'Cairo',
    cityAr: 'القاهرة',
    id: ''
  });

  // Form Fields State (Users)
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    nameAr: '',
    password: '',
    role: 'doctor',
    specialty: 'general',
    organizationId: ''
  });

  // Form Fields State (Patients)
  const [patientForm, setPatientForm] = useState({
    name: '',
    nameAr: '',
    phone: '',
    nationalId: '',
    dob: '',
    gender: 'male'
  });

  // Form Fields State (Medications)
  const [medForm, setMedForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    organizationId: ''
  });

  // --- Handlers (Organizations) ---
  const handleOpenOrgModal = (org = null) => {
    if (org) {
      setSelectedOrg(org);
      setOrgForm({ ...org });
    } else {
      setSelectedOrg(null);
      setOrgForm({
        name: '',
        nameAr: '',
        type: 'clinic',
        specialty: 'general',
        city: 'Cairo',
        cityAr: 'القاهرة',
        id: `org_${Date.now()}`
      });
    }
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = async () => {
    if (!orgForm.name.trim() || !orgForm.nameAr.trim()) {
      toast.error(isAr ? 'برجاء كتابة الاسم باللغتين' : 'Please fill name in both languages');
      return;
    }
    try {
      await addOrganization(orgForm);
      toast.success(isAr ? 'تم حفظ الجهة بنجاح!' : 'Organization saved successfully!');
      setIsOrgModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error saving organization');
    }
  };

  const handleDeleteOrg = async (id) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الجهة؟' : 'Are you sure you want to delete this organization?')) {
      try {
        await deleteOrganization(id);
        toast.success(isAr ? 'تم حذف الجهة بنجاح' : 'Organization deleted successfully');
      } catch (err) {
        toast.error('Error deleting organization');
      }
    }
  };

  // --- Handlers (Users) ---
  const handleOpenUserModal = (user = null) => {
    const defaultOrg = organizations[0]?.id || '';
    if (user) {
      setSelectedUser(user);
      setUserForm({ ...user });
    } else {
      setSelectedUser(null);
      setUserForm({
        email: '',
        name: '',
        nameAr: '',
        password: '',
        role: 'doctor',
        specialty: 'general',
        organizationId: defaultOrg
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.email.trim() || !userForm.name.trim() || !userForm.nameAr.trim()) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (!selectedUser && !userForm.password) {
      toast.error(isAr ? 'يرجى إدخال كلمة مرور للمستخدم الجديد' : 'Please enter a password for the new user');
      return;
    }
    try {
      if (selectedUser) {
        await adminUpdateUser(selectedUser.id, userForm);
        toast.success(isAr ? 'تم تحديث الحساب بنجاح' : 'User account updated successfully');
      } else {
        await adminCreateUser(userForm);
        toast.success(isAr ? 'تم إنشاء حساب المستخدم بنجاح! وسيتفعل عند تسجيل دخوله الأول.' : 'User account created! Active on their first login.');
      }
      setIsUserModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error saving user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Are you sure you want to delete this user?')) {
      try {
        await adminDeleteUser(id);
        toast.success(isAr ? 'تم حذف الحساب بنجاح' : 'User deleted successfully');
      } catch (err) {
        toast.error('Error deleting user');
      }
    }
  };

  // --- Handlers (Patients) ---
  const handleOpenPatientModal = (patient) => {
    setSelectedPatient(patient);
    setPatientForm({ ...patient });
    setIsPatientModalOpen(true);
  };

  const handleSavePatient = async () => {
    if (!patientForm.name.trim() || !patientForm.nameAr.trim() || !patientForm.phone.trim()) {
      toast.error(isAr ? 'يرجى ملء البيانات الأساسية للمريض' : 'Please fill patient basic details');
      return;
    }
    try {
      await updatePatient(selectedPatient.id, patientForm);
      toast.success(isAr ? 'تم تصحيح بيانات المريض بنجاح!' : 'Patient details corrected successfully!');
      setIsPatientModalOpen(false);
    } catch (err) {
      toast.error('Error updating patient');
    }
  };

  // --- Handlers (Inventory) ---
  const handleOpenMedModal = (med = null) => {
    if (med) {
      setSelectedMed(med);
      setMedForm({ ...med });
    } else {
      setSelectedMed(null);
      const defaultPharmacy = organizations.find(org => org.type === 'pharmacy')?.id || '';
      setMedForm({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        organizationId: defaultPharmacy
      });
    }
    setIsMedModalOpen(true);
  };

  const handleSaveMed = async () => {
    if (!medForm.name.trim() || medForm.price < 0 || medForm.stock < 0) {
      toast.error(isAr ? 'بيانات الدواء غير صالحة' : 'Invalid medicine details');
      return;
    }
    if (!medForm.organizationId) {
      toast.error(isAr ? 'يرجى اختيار الصيدلية أولاً' : 'Please assign a pharmacy');
      return;
    }
    try {
      if (selectedMed) {
        await updateMedication(selectedMed.id, medForm);
        toast.success(isAr ? 'تم تعديل صنف الدواء بنجاح!' : 'Medication updated successfully!');
      } else {
        await addMedication(medForm);
        toast.success(isAr ? 'تم إضافة الدواء بنجاح!' : 'Medication added successfully!');
      }
      setIsMedModalOpen(false);
    } catch (err) {
      toast.error(selectedMed ? 'Error updating medication' : 'Error adding medication');
    }
  };

  const handleDeleteMed = async (id) => {
    if (confirm(isAr ? 'هل تريد حذف هذا الدواء؟' : 'Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedication(id);
        toast.success(isAr ? 'تم حذف الدواء بنجاح' : 'Medication deleted successfully');
      } catch (err) {
        toast.error('Error deleting medication');
      }
    }
  };

  // --- Handler (Change Master Admin Password) ---
  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast.error(isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password');
      return;
    }
    if (!newPassword) {
      toast.error(isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    try {
      await changeUserPassword(currentPassword, newPassword);
      toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || (isAr ? 'خطأ في تغيير كلمة المرور' : 'Error changing password'));
    }
  };

  // Filtered lists
  const filteredOrgs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return organizations.filter(o => o.name?.toLowerCase().includes(q) || o.nameAr?.includes(searchTerm) || o.id?.toLowerCase().includes(q));
  }, [organizations, searchTerm]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return allUsers.filter(u => u.name?.toLowerCase().includes(q) || u.nameAr?.includes(searchTerm) || u.email?.toLowerCase().includes(q));
  }, [allUsers, searchTerm]);

  const filteredPatients = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return patients.filter(p => p.name?.toLowerCase().includes(q) || p.nameAr?.includes(searchTerm) || p.phone?.includes(searchTerm));
  }, [patients, searchTerm]);

  const filteredMeds = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return inventory.filter(m => m.name?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
  }, [inventory, searchTerm]);

  return (
    <div className="min-h-full md:h-full flex flex-col p-4 md:p-6 gap-6 overflow-visible md:overflow-hidden">
      
      {/* Header and Quick Navigation */}
      <Card className="!p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl flex items-center justify-center border border-cyan-300/40 shadow-glow">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-2xl text-white">{isAr ? 'لوحة التحكم العام (الأدمن)' : 'Super Admin Workspace'}</h2>
            <p className="text-xs font-bold text-cyan-300 uppercase tracking-widest">{isAr ? 'تعديل البيانات وتصحيح الأخطاء' : 'Data Management & Error Correction'}</p>
          </div>
        </div>
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10 overflow-x-auto w-full md:w-auto gap-1">
          {[
            { id: 'organizations', label: 'المنشآت', icon: Building2 },
            { id: 'users', label: 'الحسابات', icon: Users },
            { id: 'patients', label: 'المرضى', icon: User },
            { id: 'inventory', label: 'الأدوية والمخازن', icon: Pill },
            { id: 'security', label: 'الأمان', icon: Lock },
            { id: 'account', label: 'إعدادات الحساب', icon: Settings }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 shrink-0 ${activeTab === tab.id ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-cyan-400 shadow-inner border border-slate-600' : 'text-slate-400 hover:text-white'}`}>
              <tab.icon className="w-4 h-4" />
              {isAr ? tab.label : tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
            </button>
          ))}
        </div>
      </Card>
 
      <div className="flex-1 overflow-visible md:overflow-y-auto min-h-0 pe-1 pb-4 flex flex-col gap-6">
 
        {/* Search input (Except on Security and Account tabs) */}
        {activeTab !== 'security' && activeTab !== 'account' && (
          <div className="max-w-xl">
            <Input placeholder={isAr ? 'البحث بالاسم أو التفاصيل...' : 'Search by name or details...'} icon={Search}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        )}

        {/* ── Tab 1: Organizations ── */}
        {activeTab === 'organizations' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> {isAr ? 'إدارة العيادات والمنشآت الطبية' : 'Manage Medical Facilities'} ({organizations.length})
              </h3>
              <button onClick={() => handleOpenOrgModal(null)} className={`${s.btnPrimary} !h-10 !px-4 text-sm !bg-gradient-to-br !from-cyan-500 !to-blue-700 !border-cyan-400/20`}>
                <Plus className="w-4 h-4" /> {isAr ? 'إضافة جهة جديدة' : 'Add Organization'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map(org => (
                <InnerCard key={org.id} className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className={`${s.badge} !bg-cyan-500/20 !text-cyan-300 !border-cyan-500/30`}>
                        {org.type === 'clinic' ? (isAr ? 'عيادة' : 'Clinic')
                         : org.type === 'pharmacy' ? (isAr ? 'صيدلية' : 'Pharmacy')
                         : org.type === 'lab' ? (isAr ? 'معمل تحاليل' : 'Laboratory')
                         : (isAr ? 'مركز أشعة' : 'Radiology')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">{org.id}</span>
                    </div>
                    <h4 className="font-black text-lg text-white mt-2 leading-tight">{org.nameAr}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">{org.name}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {isAr ? 'المدينة: ' : 'City: '}{isAr ? org.cityAr : org.city}
                      {org.specialty && ` • ${isAr ? SPECIALTIES.find(s => s.id === org.specialty)?.ar : org.specialty}`}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <button onClick={() => handleOpenOrgModal(org)} className={`${s.btnGhost} !h-9 text-xs !px-2.5 flex-1`}>
                      <Edit3 className="w-3.5 h-3.5" /> {isAr ? 'تعديل الإملاء' : 'Edit Spelling'}
                    </button>
                    <button onClick={() => handleDeleteOrg(org.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </InnerCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 2: Users ── */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" /> {isAr ? 'إدارة حسابات ومستخدمي النظام' : 'Manage System Users'} ({allUsers.length})
              </h3>
              <button onClick={() => handleOpenUserModal(null)} className={`${s.btnPrimary} !h-10 !px-4 text-sm !bg-gradient-to-br !from-cyan-500 !to-blue-700 !border-cyan-400/20`}>
                <Plus className="w-4 h-4" /> {isAr ? 'إنشاء مستخدم جديد' : 'Create User Account'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => {
                const org = organizations.find(o => o.id === user.organizationId);
                return (
                  <InnerCard key={user.id || user.email} className="flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`${s.badge} !bg-emerald-500/20 !text-emerald-300 !border-emerald-500/30`}>
                          {t(user.role)}
                        </span>
                        {user.password && <span className="text-[10px] text-amber-300/80 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">{isAr ? 'بانتظار الدخول الأول' : 'Pending Activation'}</span>}
                      </div>
                      <h4 className="font-black text-lg text-white mt-2 leading-tight">{user.nameAr || user.name}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 truncate">{user.email}</p>
                      <div className="mt-3 text-xs text-slate-500 flex flex-col gap-1">
                        <p><strong>{isAr ? 'الجهة: ' : 'Organization: '}</strong>{org ? (isAr ? org.nameAr : org.name) : (isAr ? 'غير محددة' : 'Not assigned')}</p>
                        {user.specialty && <p><strong>{isAr ? 'التخصص: ' : 'Specialty: '}</strong>{isAr ? SPECIALTIES.find(s => s.id === user.specialty)?.ar : user.specialty}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button onClick={() => handleOpenUserModal(user)} className={`${s.btnGhost} !h-9 text-xs !px-2.5 flex-1`}>
                        <Edit3 className="w-3.5 h-3.5" /> {isAr ? 'تعديل البيانات' : 'Edit Account'}
                      </button>
                      <button onClick={() => handleDeleteUser(user.id || user.email)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </InnerCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 3: Patients ── */}
        {activeTab === 'patients' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <h3 className="font-black text-xl text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> {isAr ? 'تعديل وتصحيح بيانات المرضى الكلي' : 'Edit Global Patient Records'} ({patients.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map(p => (
                <InnerCard key={p.id} className="flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="font-black text-lg text-white leading-tight">{p.nameAr || p.name}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">{p.name}</p>
                    <div className="mt-3 text-xs text-slate-500 flex flex-col gap-1">
                      <p><strong>{isAr ? 'رقم الهاتف: ' : 'Phone: '}</strong>{p.phone}</p>
                      {p.nationalId && <p><strong>{isAr ? 'الرقم القومي: ' : 'National ID: '}</strong>{p.nationalId}</p>}
                      <p><strong>{isAr ? 'النوع/تاريخ الميلاد: ' : 'Gender/DOB: '}</strong>{p.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')} • {p.dob}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <button onClick={() => handleOpenPatientModal(p)} className={`${s.btnSec} !h-9 text-xs w-full`}>
                      <Edit3 className="w-3.5 h-3.5" /> {isAr ? 'تصحيح أخطاء الاسم أو الهاتف' : 'Correct Spelling / Phone'}
                    </button>
                  </div>
                </InnerCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 4: Inventory ── */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-cyan-400" /> {isAr ? 'تعديل وتصحيح مستودع الأدوية العام' : 'Global Pharmacy Medication Manager'} ({inventory.length})
              </h3>
              <button 
                onClick={() => handleOpenMedModal(null)}
                className={`${s.btnPrimary} !h-10 !px-4 text-sm`}
              >
                <Plus className="w-4 h-4" /> {isAr ? 'إضافة دواء جديد' : 'Add Medication'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeds.map(med => {
                const org = organizations.find(o => o.id === med.organizationId);
                return (
                  <InnerCard key={med.id || med.name} className="flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                          {org ? (isAr ? org.nameAr : org.name) : (isAr ? 'صيدلية غير محددة' : 'Unknown Pharmacy')}
                        </span>
                        <span className="font-black text-amber-300">{med.price} {isAr ? 'ج.م' : 'EGP'}</span>
                      </div>
                      <h4 className="font-black text-lg text-white mt-2 leading-tight">{med.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-2">{med.description}</p>
                      <p className="text-xs text-slate-500 mt-2"><strong>{isAr ? 'المخزون المتوفر: ' : 'Stock Level: '}</strong>{med.stock} {isAr ? 'عبوة' : 'units'}</p>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button onClick={() => handleOpenMedModal(med)} className={`${s.btnGhost} !h-9 text-xs !px-2.5 flex-1`}>
                        <Edit3 className="w-3.5 h-3.5" /> {isAr ? 'تعديل الدواء' : 'Edit Med'}
                      </button>
                      <button onClick={() => handleDeleteMed(med.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </InnerCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 5: Security & Settings ── */}
        {activeTab === 'security' && (
          <Card className="max-w-md mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-4">
            <h3 className="font-black text-white text-xl flex items-center gap-2 border-b border-white/10 pb-3">
              <Lock className="w-5 h-5 text-cyan-400" /> {isAr ? 'إعدادات الأمان وتغيير كلمة المرور' : 'Security Settings & Password'}
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isAr ? 'بريد الأدمن الرئيسي (غير قابل للتعديل)' : 'Master Admin Email (ReadOnly)'}</label>
              <p className="p-3 bg-black/40 text-slate-300 rounded-xl border border-white/5 font-mono font-bold">m.okash@we_clinic.com</p>
            </div>

            <div className="flex flex-col gap-4">
              <Input label={isAr ? 'كلمة المرور الحالية' : 'Current Password'} type="password" placeholder="••••••••"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />

              <Input label={isAr ? 'كلمة المرور الجديدة' : 'New Password'} type="password" placeholder="••••••••"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              
              <Input label={isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'} type="password" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            <button onClick={handleSavePassword} className={`${s.btnPrimary} !bg-gradient-to-br !from-cyan-500 !to-blue-700 !border-cyan-400/20 w-full`}>
              <Save className="w-5 h-5" />
              {isAr ? 'حفظ كلمة المرور الجديدة' : 'Save Password'}
            </button>
          </Card>
        )}

        {/* ── Tab 6: Account Settings ── */}
        {activeTab === 'account' && (
          <div className="animate-in slide-in-from-bottom-4">
            <AccountSettingsView />
          </div>
        )}

      </div>

      {/* ─── Modals ─── */}

      {/* Organization Modal */}
      <GlassModal isOpen={isOrgModalOpen} onClose={() => setIsOrgModalOpen(false)} title={selectedOrg ? (isAr ? 'تعديل الجهة' : 'Edit Organization') : (isAr ? 'إضافة جهة جديدة' : 'Add New Organization')}>
        <div className="flex flex-col gap-4">
          <Input label={isAr ? 'الاسم بالإنجليزية' : 'Name (English)'} value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} />
          <Input label={isAr ? 'الاسم بالعربية' : 'Name (Arabic)'} value={orgForm.nameAr} onChange={e => setOrgForm({ ...orgForm, nameAr: e.target.value })} />
          
          <div className="flex flex-col gap-2">
            <label className={s.label}>{isAr ? 'نوع المنشأة' : 'Facility Type'}</label>
            <div className="relative w-full">
              <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={orgForm.type} onChange={e => setOrgForm({ ...orgForm, type: e.target.value })}>
                <option value="clinic">{isAr ? 'عيادة طبية' : 'Clinic'}</option>
                <option value="pharmacy">{isAr ? 'صيدلية' : 'Pharmacy'}</option>
                <option value="lab">{isAr ? 'معمل تحاليل' : 'Laboratory'}</option>
                <option value="radiology">{isAr ? 'مركز أشعة' : 'Radiology Center'}</option>
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>

          {orgForm.type === 'clinic' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className={s.label}>{isAr ? 'التخصص الطبي للعيادة' : 'Medical Specialty'}</label>
              <div className="relative w-full">
                <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={orgForm.specialty} onChange={e => setOrgForm({ ...orgForm, specialty: e.target.value })}>
                  {SPECIALTIES.map(sp => (
                    <option key={sp.id} value={sp.id}>{isAr ? sp.ar : sp.en}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-emerald-500/80" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'المدينة (EN)' : 'City (English)'} value={orgForm.city} onChange={e => setOrgForm({ ...orgForm, city: e.target.value })} />
            <Input label={isAr ? 'المدينة (AR)' : 'City (Arabic)'} value={orgForm.cityAr} onChange={e => setOrgForm({ ...orgForm, cityAr: e.target.value })} />
          </div>

          <button onClick={handleSaveOrg} className={`${s.btnPrimary} w-full mt-4`}>
            <Save className="w-5 h-5" /> {isAr ? 'حفظ البيانات' : 'Save Facility'}
          </button>
        </div>
      </GlassModal>

      {/* User Modal */}
      <GlassModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={selectedUser ? (isAr ? 'تعديل بيانات الحساب' : 'Edit User Profile') : (isAr ? 'إنشاء حساب جديد' : 'Create User Account')}>
        <div className="flex flex-col gap-4">
          <Input label={isAr ? 'البريد الإلكتروني' : 'Email Address'} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} disabled={!!selectedUser} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'الاسم بالإنجليزية' : 'Name (EN)'} value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
            <Input label={isAr ? 'الاسم بالعربية' : 'Name (AR)'} value={userForm.nameAr} onChange={e => setUserForm({ ...userForm, nameAr: e.target.value })} />
          </div>

          {!selectedUser && (
            <Input label={isAr ? 'كلمة المرور الافتراضية' : 'Default Password'} type="text" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="password" />
          )}

          <div className="flex flex-col gap-2">
            <label className={s.label}>{isAr ? 'دور الحساب (Role)' : 'Account Role'}</label>
            <div className="relative w-full">
              <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="doctor">{isAr ? 'طبيب' : 'Doctor'}</option>
                <option value="receptionist">{isAr ? 'موظف استقبال' : 'Receptionist'}</option>
                <option value="pharmacy">{isAr ? 'صيدلي' : 'Pharmacist'}</option>
                <option value="radiology">{isAr ? 'فني معمل/أشعة' : 'Lab Tech'}</option>
                <option value="manager">{isAr ? 'مدير منشأة' : 'Facility Manager'}</option>
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>

          {userForm.role === 'doctor' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className={s.label}>{isAr ? 'التخصص الطبي' : 'Specialty'}</label>
              <div className="relative w-full">
                <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={userForm.specialty} onChange={e => setUserForm({ ...userForm, specialty: e.target.value })}>
                  {SPECIALTIES.map(sp => (
                    <option key={sp.id} value={sp.id}>{isAr ? sp.ar : sp.en}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-emerald-500/80" />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className={s.label}>{isAr ? 'الجهة الطبية التابع لها' : 'Assigned Organization'}</label>
            <div className="relative w-full">
              <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={userForm.organizationId} onChange={e => setUserForm({ ...userForm, organizationId: e.target.value })}>
                {organizations
                  .filter(org => {
                    if (userForm.role === 'doctor' || userForm.role === 'receptionist') return org.type === 'clinic';
                    if (userForm.role === 'pharmacy') return org.type === 'pharmacy';
                    if (userForm.role === 'radiology') return org.type === 'lab' || org.type === 'radiology';
                    return true;
                  })
                  .map(org => (
                    <option key={org.id} value={org.id}>{isAr ? org.nameAr : org.name}</option>
                  ))}
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>

          <button onClick={handleSaveUser} className={`${s.btnPrimary} w-full mt-4`}>
            <Save className="w-5 h-5" /> {isAr ? 'حفظ الحساب' : 'Save Account'}
          </button>
        </div>
      </GlassModal>

      {/* Patient Modal */}
      <GlassModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title={isAr ? 'تصحيح بيانات المريض' : 'Correct Patient Details'}>
        <div className="flex flex-col gap-4">
          <Input label={isAr ? 'الاسم بالكامل (عربي)' : 'Name (Arabic)'} value={patientForm.nameAr} onChange={e => setPatientForm({ ...patientForm, nameAr: e.target.value })} />
          <Input label={isAr ? 'الاسم بالكامل (إنجليزي)' : 'Name (English)'} value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })} />
          <Input label={isAr ? 'رقم الهاتف' : 'Phone Number'} value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} />
          <Input label={isAr ? 'الرقم القومي (اختياري)' : 'National ID (Optional)'} value={patientForm.nationalId} onChange={e => setPatientForm({ ...patientForm, nationalId: e.target.value })} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'تاريخ الميلاد' : 'Date of Birth'} type="date" value={patientForm.dob} onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })} />
            <div className="flex flex-col gap-2">
              <label className={s.label}>{isAr ? 'الجنس' : 'Gender'}</label>
              <div className="relative w-full">
                <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}>
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-emerald-500/80" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSavePatient} className={`${s.btnPrimary} w-full mt-4`}>
            <Save className="w-5 h-5" /> {isAr ? 'حفظ التعديلات' : 'Save Changes'}
          </button>
        </div>
      </GlassModal>

      {/* Medication Modal */}
      <GlassModal isOpen={isMedModalOpen} onClose={() => setIsMedModalOpen(false)} title={selectedMed ? (isAr ? 'تعديل صنف الدواء' : 'Edit Medication details') : (isAr ? 'إضافة دواء جديد' : 'Add New Medication')}>
        <div className="flex flex-col gap-4">
          <Input label={isAr ? 'اسم الدواء (العام)' : 'Medicine Name'} value={medForm.name} onChange={e => setMedForm({ ...medForm, name: e.target.value })} />
          <Input label={isAr ? 'الوصف السريري' : 'Description'} value={medForm.description} onChange={e => setMedForm({ ...medForm, description: e.target.value })} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'سعر البيع (ج.م)' : 'Price (EGP)'} type="number" value={medForm.price} onChange={e => setMedForm({ ...medForm, price: parseFloat(e.target.value) || 0 })} />
            <Input label={isAr ? 'المخزون المتوفر' : 'Stock level'} type="number" value={medForm.stock} onChange={e => setMedForm({ ...medForm, stock: parseInt(e.target.value) || 0 })} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={s.label}>{isAr ? 'الصيدلية' : 'Pharmacy Assignment'}</label>
            <div className="relative w-full">
              <select className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`} value={medForm.organizationId} onChange={e => setMedForm({ ...medForm, organizationId: e.target.value })}>
                {organizations
                  .filter(org => org.type === 'pharmacy')
                  .map(org => (
                    <option key={org.id} value={org.id}>{isAr ? org.nameAr : org.name}</option>
                  ))}
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>

          <button onClick={handleSaveMed} className={`${s.btnPrimary} w-full mt-4`}>
            <Save className="w-5 h-5" /> {selectedMed ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة الدواء' : 'Add Medication')}
          </button>
        </div>
      </GlassModal>

    </div>
  );
}
