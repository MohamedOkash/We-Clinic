import { useEffect, useMemo, useState } from 'react';
import { Activity, User, Lock, Globe, ChevronDown } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { SPECIALTIES } from '../constants';
import { Card, Input, s } from '../components/shared';
import { useToast } from '../hooks/useToast';

export default function AuthView() {
  const toast = useToast();
  const { t, lang, setLang, handleLogin, handleSignUp, handleGoogleSignIn, isAr, organizations } = useClinic();
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-8 relative z-10 gap-4">
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className={`${s.btnSec} !h-10 !px-5 self-end`}
      >
        <Globe className="w-4 h-4 text-cyan-400" />
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <Card className="w-full max-w-md flex flex-col gap-5 md:gap-6 animate-in zoom-in-95 duration-700 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-200/80 dark:border-white/10">
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
            <div className="relative w-full">
              <select
                className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`}
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
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>
          {selectedRole === 'doctor' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 px-1">{t('selectSpecialty')}</label>
              <div className="relative w-full">
                <select
                  className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`}
                  value={selectedSpec}
                  onChange={e => setSelectedSpec(e.target.value)}
                  dir={isAr ? 'rtl' : 'ltr'}
                >
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
          {isLogin && selectedRole !== 'admin' && (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 px-1">
                {isAr ? 'اختر الجهة / العيادة' : 'Select Clinic / Pharmacy / Lab'}
              </label>
              <div className="relative w-full">
                <select
                  className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`}
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
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-emerald-500/80" />
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={onSubmit} className={`${s.btnPrimary} w-full !h-14 text-xl mt-2`}>
          {isLogin ? t('signIn') : t('signUp')}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
            {isAr ? 'أو عبر' : 'Or via'}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
        </div>

        <button 
          onClick={async () => {
            try {
              await handleGoogleSignIn(selectedRole, selectedRole === 'doctor' ? selectedSpec : null, selectedOrgId);
              toast.success(isAr ? 'تم تسجيل الدخول بجوجل بنجاح!' : 'Logged in with Google successfully!');
            } catch (err) {
              toast.error(err.message || (isAr ? 'حدث خطأ في الدخول بجوجل' : 'Google Authentication error'));
            }
          }} 
          className="w-full h-14 rounded-2xl border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-black/30 text-slate-700 dark:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-all duration-300 font-black text-sm flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>{isLogin ? (isAr ? 'الدخول بحساب جوجل' : 'Sign in with Google') : (isAr ? 'التسجيل بحساب جوجل' : 'Sign up with Google')}</span>
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
