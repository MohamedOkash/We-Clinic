import { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Building2, Globe, Sun, Moon, Lock, Save, KeyRound, Activity
} from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, Input, s } from '../components/shared';
import { useToast } from '../hooks/useToast';
import { SPECIALTIES } from '../constants';

export default function AccountSettingsView() {
  const { 
    loggedUser, role, specialty, organizations, 
    lang, setLang, theme, setTheme, isAr, t, 
    changeUserPassword, updateUserProfile 
  } = useClinic();

  const toast = useToast();
  const isDark = theme !== 'light';

  // Personal Info States
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync state with loggedUser info
  useEffect(() => {
    if (loggedUser) {
      setName(loggedUser.name || '');
      setNameAr(loggedUser.nameAr || '');
      setPhone(loggedUser.phone || '');
    }
  }, [loggedUser]);

  // Find organization details
  const org = organizations.find(o => o.id === loggedUser?.organizationId);
  const facilityName = loggedUser?.organizationId === 'system' || role === 'admin'
    ? (isAr ? 'إدارة النظام العام' : 'System Administration')
    : org 
      ? (isAr ? org.nameAr : org.name) 
      : (isAr ? 'منشأة غير معروفة' : 'Unknown Facility');

  // Find specialty details
  const specObj = SPECIALTIES.find(s => s.id === specialty || s.id === loggedUser?.specialty);
  const specialtyLabel = specObj ? (isAr ? specObj.ar : specObj.en) : null;

  // Handle personal profile details update
  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast.error(isAr ? 'الاسم بالإنجليزية مطلوب' : 'Name in English is required');
      return;
    }
    if (!nameAr.trim()) {
      toast.error(isAr ? 'الاسم بالعربية مطلوب' : 'Name in Arabic is required');
      return;
    }
    setProfileLoading(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        nameAr: nameAr.trim(),
        phone: phone.trim()
      });
      toast.success(isAr ? 'تم حفظ البيانات الشخصية بنجاح!' : 'Profile details updated successfully!');
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء تحديث البيانات' : 'Error updating profile details');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change submission
  const handlePasswordSave = async () => {
    if (!currentPassword) {
      toast.error(isAr ? 'يرجى إدخال كلمة المرور الحالية أولاً' : 'Please enter your current password first');
      return;
    }
    if (!newPassword) {
      toast.error(isAr ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter the new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || (isAr ? 'خطأ أثناء تغيير كلمة المرور' : 'Error updating password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-full md:h-full flex flex-col p-4 md:p-6 gap-6 overflow-visible md:overflow-y-auto scrollbar-thin">
      
      {/* Header card */}
      <Card className="!p-4 shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center border border-emerald-300/20 shadow-sm shrink-0">
          <User className="w-6 h-6 text-white keep-text-white" />
        </div>
        <div>
          <h2 className="font-black text-2xl text-emerald-950 dark:text-emerald-50">{isAr ? 'حسابي الشخصي وإعداداتي' : 'My Account & Settings'}</h2>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{isAr ? 'إدارة البيانات، المظهر، وكلمة المرور' : 'Manage profile info, layout, and credentials'}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Profile information */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col gap-6">
            <h3 className="font-black text-emerald-950 dark:text-emerald-50 text-lg flex items-center gap-2 border-b border-emerald-500/10 dark:border-emerald-400/10 pb-3 select-none">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? 'الملف الشخصي والبيانات' : 'Personal Profile & Details'}
            </h3>

            {/* Profile Avatar / Large Initials */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 dark:bg-black/30 dark:border-white/5 gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white keep-text-white flex items-center justify-center text-3xl font-black border border-emerald-300/30 shadow-md">
                {(name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-base">{isAr ? nameAr : name}</h4>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">{t(role)}</p>
              </div>
            </div>

            {/* Editable Profile Fields */}
            <div className="flex flex-col gap-4">
              <Input 
                label={isAr ? 'الاسم بالكامل (بالإنجليزية)' : 'Full Name (English)'} 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
              <Input 
                label={isAr ? 'الاسم بالكامل (بالعربية)' : 'Full Name (Arabic)'} 
                value={nameAr} 
                onChange={e => setNameAr(e.target.value)} 
              />
              <Input 
                label={isAr ? 'رقم الهاتف الشخصي' : 'Phone Number'} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />

              <button 
                onClick={handleProfileSave}
                disabled={profileLoading}
                className={`${s.btnSec} w-full gap-2 flex items-center justify-center`}
              >
                <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{profileLoading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ البيانات الشخصية' : 'Save Details')}</span>
              </button>

              <hr className="border-emerald-500/10 dark:border-emerald-400/10 my-1" />

              {/* Read-Only Identity Fields */}
              <div className="flex flex-col gap-3">
                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-black/20 border border-emerald-500/5 dark:border-white/5">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                    <span className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-50 truncate block">{loggedUser?.email}</span>
                  </div>
                </div>

                {/* Organization */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-black/20 border border-emerald-500/5 dark:border-white/5">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">{isAr ? 'المنشأة الطبية المعين بها' : 'Assigned Facility'}</span>
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 truncate block">{facilityName}</span>
                  </div>
                </div>

                {/* Specialty (If exists) */}
                {specialtyLabel && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-black/20 border border-emerald-500/5 dark:border-white/5">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">{isAr ? 'التخصص الطبي الفعلي' : 'Clinical Specialty'}</span>
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 truncate block">{specialtyLabel}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Column 2 & 3: Configuration & Security Change */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Section A: App Appearance & Language */}
          <Card className="flex flex-col gap-5">
            <h3 className="font-black text-emerald-950 dark:text-emerald-50 text-lg flex items-center gap-2 border-b border-emerald-500/10 dark:border-emerald-400/10 pb-3 select-none">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? 'تخصيص الواجهة واللغة' : 'Interface Settings & Language'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Theme Toggle card */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-black/30 border border-emerald-500/10 dark:border-white/5 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-sm flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    {isAr ? 'المظهر العام للتطبيق' : 'Application Theme'}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isAr ? 'اختر بين الوضع الفاتح لراحة العين أو الوضع الداكن للجمالية الفائقة.' : 'Toggle between clean light mode or smooth aesthetic dark mode.'}</p>
                </div>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="w-full h-11 bg-white dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all font-black text-sm flex items-center justify-center gap-2"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
                  {isDark ? (isAr ? 'تغيير للوضع الفاتح' : 'Switch to Light') : (isAr ? 'تغيير للوضع الداكن' : 'Switch to Dark')}
                </button>
              </div>

              {/* Language Toggle card */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-black/30 border border-emerald-500/10 dark:border-white/5 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    {isAr ? 'اللغة الحالية' : 'Language (RTL/LTR)'}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isAr ? 'قم بالتحويل الفوري لواجهة الاستخدام بين العربية والإنجليزية.' : 'Instantly switch the translation direction between Arabic and English.'}</p>
                </div>
                <button
                  onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                  className="w-full h-11 bg-white dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all font-black text-sm flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-cyan-500" />
                  {lang === 'ar' ? 'English (UK)' : 'العربية (RTL)'}
                </button>
              </div>

            </div>
          </Card>

          {/* Section B: Password reset */}
          <Card className="flex flex-col gap-5">
            <h3 className="font-black text-emerald-950 dark:text-emerald-50 text-lg flex items-center gap-2 border-b border-emerald-500/10 dark:border-emerald-400/10 pb-3 select-none">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? 'إعدادات الأمان وتحديث الرمز' : 'Security Settings & Password Change'}
            </h3>

            <div className="flex flex-col gap-4">
              <Input 
                label={isAr ? 'كلمة المرور الحالية' : 'Current Password'} 
                type="password" 
                placeholder="••••••••"
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label={isAr ? 'كلمة المرور الجديدة' : 'New Password'} 
                  type="password" 
                  placeholder="••••••••"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
                
                <Input 
                  label={isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'} 
                  type="password" 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                />
              </div>

              <button 
                onClick={handlePasswordSave} 
                disabled={passwordLoading}
                className={`${s.btnPrimary} w-full mt-2 gap-2 flex items-center justify-center`}
              >
                <KeyRound className="w-5 h-5 text-white keep-text-white" />
                <span>{passwordLoading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تعديل وحفظ كلمة المرور الجديدة' : 'Save Password')}</span>
              </button>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
