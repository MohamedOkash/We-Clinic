import { useEffect, useMemo, useState } from 'react';
import { Activity, User, Lock, Globe } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { SPECIALTIES } from '../constants';
import { Card, Input, s } from '../components/shared';
import { useToast } from '../hooks/useToast';

export default function AuthView() {
  const toast = useToast();
  const { t, lang, setLang, handleLogin, handleSignUp, isAr, organizations } = useClinic();
  const [isLogin, setIsLogin]             = useState(true);
  const [selectedRole, setSelectedRole]   = useState('doctor');
  const [selectedSpec, setSelectedSpec]   = useState('orthopedics');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [email, setEmail]                 = useState('');
  const [name, setName]                   = useState('');
  const [pass,  setPass]                  = useState('');
  const [pass2, setPass2]                 = useState('');
  const [errors, setErrors]               = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = isAr ? 'البريد مطلوب' : 'Email is required';
    if (!pass)         e.pass  = isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
    if (!isLogin && !name.trim()) e.name = isAr ? 'الاسم مطلوب' : 'Name is required';
    if (!isLogin && pass !== pass2) e.pass2 = isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const organizationOptions = useMemo(() => {
    if (selectedRole === 'doctor') {
      return organizations.filter(org => org.type === 'clinic' && org.specialty === selectedSpec);
    }
    if (selectedRole === 'receptionist') {
      return organizations.filter(org => org.type === 'clinic');
    }
    if (selectedRole === 'pharmacy') {
      return organizations.filter(org => org.type === 'pharmacy');
    }
    if (selectedRole === 'radiology') {
      return organizations.filter(org => org.type === 'lab' || org.type === 'radiology');
    }
    if (selectedRole === 'manager') {
      return organizations;
    }
    return organizations;
  }, [organizations, selectedRole, selectedSpec]);

  useEffect(() => {
    if (!organizationOptions.length) {
      setSelectedOrgId('');
      return;
    }
    if (!organizationOptions.some(org => org.id === selectedOrgId)) {
      setSelectedOrgId(organizationOptions[0].id);
    }
  }, [organizationOptions, selectedOrgId]);

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      if (isLogin) {
        await handleLogin(email, pass, selectedRole, selectedRole === 'doctor' ? selectedSpec : null, selectedOrgId);
        toast.success(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');
      } else {
        await handleSignUp(email, name, pass, selectedRole, selectedRole === 'doctor' ? selectedSpec : null, selectedOrgId);
        toast.success(isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      }
    } catch (err) {
      toast.error(err.message || (isAr ? 'حدث خطأ في الدخول' : 'Authentication error'));
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative z-10 gap-4">
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className={`${s.btnSec} !h-10 !px-5 self-end`}
      >
        <Globe className="w-4 h-4 text-cyan-400" />
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <Card className="w-full max-w-md flex flex-col gap-6 animate-in zoom-in-95 duration-700 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-200/80 dark:border-white/10">
        <div className="text-center mb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-700 rounded-3xl flex items-center justify-center text-white mx-auto mb-5 shadow-[0_10px_20px_rgba(6,182,212,0.5)] border border-cyan-300/40">
            <Activity className="w-10 h-10 keep-text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('appTitle')}</h1>
          <p className="text-cyan-600 dark:text-cyan-200 mt-2 font-bold">{isLogin ? t('enterCredentials') : t('createAccount')}</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label={t('emailOrPhone')} placeholder="admin@clinic.com"
            icon={User} value={email} onChange={e => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label={t('password')} type="password" placeholder="••••••••"
            icon={Lock} value={pass} onChange={e => setPass(e.target.value)}
            error={errors.pass}
          />

          {!isLogin && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <Input
                label={isAr ? 'الاسم الكامل' : 'Full Name'} placeholder={isAr ? 'مثال: د. محمد علي' : 'e.g. Dr. John Doe'}
                icon={User} value={name} onChange={e => setName(e.target.value)}
                error={errors.name}
              />
              <Input
                label={t('confirmPassword')} type="password" placeholder="••••••••"
                icon={Lock} value={pass2} onChange={e => setPass2(e.target.value)}
                error={errors.pass2}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 px-1">{t('selectRole')}</label>
            <select
              className={`${s.input} appearance-none cursor-pointer`}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {['patient','doctor','receptionist','pharmacy','radiology','manager']
                .concat(isLogin ? ['admin'] : [])
                .map(r => (
                  <option key={r} value={r}>{t(r)}</option>
                ))}
            </select>
          </div>
          {selectedRole === 'doctor' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 px-1">{t('selectSpecialty')}</label>
              <select
                className={`${s.input} appearance-none cursor-pointer`}
                value={selectedSpec}
                onChange={e => setSelectedSpec(e.target.value)}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {SPECIALTIES.map(sp => (
                  <option key={sp.id} value={sp.id}>{isAr ? sp.ar : sp.en}</option>
                ))}
              </select>
            </div>
          )}
          {isLogin && selectedRole !== 'admin' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 px-1">
                {isAr ? 'اختر الجهة / العيادة' : 'Select Clinic / Pharmacy / Lab'}
              </label>
              <select
                className={`${s.input} appearance-none cursor-pointer`}
                value={selectedOrgId}
                onChange={e => setSelectedOrgId(e.target.value)}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {organizationOptions.map(org => (
                  <option key={org.id} value={org.id}>
                    {isAr ? org.nameAr : org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={onSubmit} className={`${s.btnPrimary} w-full !h-14 text-xl mt-2`}>
          {isLogin ? t('signIn') : t('signUp')}
        </button>

        <div className="text-center border-t border-slate-200 dark:border-white/10 pt-5">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
            <button
              onClick={() => {
                const nextLogin = !isLogin;
                setIsLogin(nextLogin);
                setErrors({});
                if (!nextLogin && selectedRole === 'admin') {
                  setSelectedRole('doctor');
                }
              }}
              className="font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
            >
              {isLogin ? t('signUp') : t('signIn')}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
