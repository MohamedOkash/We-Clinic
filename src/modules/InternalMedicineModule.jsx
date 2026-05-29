import { useState } from 'react';
import { Heart, Droplets, Activity, Gauge } from 'lucide-react';
import { InnerCard, s } from '../components/shared';

export default function InternalMedicineModule({ t }) {
  const isAr = t('appTitle') !== 'Our Clinic 3D';
  const [bp, setBp] = useState([]);
  const [bpInput, setBpInput] = useState({ sys: '', dia: '', pulse: '' });
  const [sugar, setSugar] = useState([]);
  const [sugarInput, setSugarInput] = useState({ value: '', timing: 'fasting' });
  const [labs, setLabs] = useState({ hb: '', wbc: '', plt: '', creatinine: '', urea: '', alt: '', ast: '' });

  const addBP = () => {
    if (!bpInput.sys || !bpInput.dia) return;
    setBp(prev => [...prev, { ...bpInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setBpInput({ sys: '', dia: '', pulse: '' });
  };

  const addSugar = () => {
    if (!sugarInput.value) return;
    setSugar(prev => [...prev, { ...sugarInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setSugarInput({ value: '', timing: 'fasting' });
  };

  const bpStatus = (sys) => {
    const s = parseInt(sys);
    if (s < 120) return { label: isAr ? 'طبيعي' : 'Normal', color: 'text-emerald-400' };
    if (s < 140) return { label: isAr ? 'مرتفع' : 'Elevated', color: 'text-amber-400' };
    return { label: isAr ? 'ارتفاع ضغط' : 'Hypertension', color: 'text-red-400' };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Blood Pressure Tracker */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" /> {isAr ? 'متابعة ضغط الدم' : 'Blood Pressure Tracker'}
        </h4>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-semibold">{isAr ? 'انقباضي' : 'SYS'}</label>
            <input className={`${s.inputSm} !w-20 text-center`} placeholder="120" value={bpInput.sys} onChange={e => setBpInput(p => ({ ...p, sys: e.target.value }))} />
          </div>
          <span className="text-2xl text-slate-600 font-bold pb-1">/</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-semibold">{isAr ? 'انبساطي' : 'DIA'}</label>
            <input className={`${s.inputSm} !w-20 text-center`} placeholder="80" value={bpInput.dia} onChange={e => setBpInput(p => ({ ...p, dia: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-semibold">{isAr ? 'النبض' : 'Pulse'}</label>
            <input className={`${s.inputSm} !w-20 text-center`} placeholder="72" value={bpInput.pulse} onChange={e => setBpInput(p => ({ ...p, pulse: e.target.value }))} />
          </div>
          <button onClick={addBP} className={`${s.btnPrimary} !h-10 !px-4 text-sm`}>+</button>
        </div>
        {bp.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
            {bp.map((r, i) => {
              const st = bpStatus(r.sys);
              return (
                <div key={i} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2 text-sm">
                  <span className="font-bold text-white">{r.sys}/{r.dia} <span className="text-slate-500">mmHg</span></span>
                  <span className="text-slate-400">{r.pulse && `${r.pulse} bpm •`} {r.time}</span>
                  <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </InnerCard>

      {/* Blood Sugar */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" /> {isAr ? 'متابعة سكر الدم' : 'Blood Glucose Tracker'}
        </h4>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-semibold">{isAr ? 'القراءة' : 'Reading'}</label>
            <input className={`${s.inputSm} !w-24 text-center`} placeholder="100" value={sugarInput.value} onChange={e => setSugarInput(p => ({ ...p, value: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-semibold">{isAr ? 'التوقيت' : 'Timing'}</label>
            <select className={`${s.inputSm} !w-32`} value={sugarInput.timing} onChange={e => setSugarInput(p => ({ ...p, timing: e.target.value }))}>
              <option value="fasting">{isAr ? 'صائم' : 'Fasting'}</option>
              <option value="postprandial">{isAr ? 'بعد الأكل' : 'Postprandial'}</option>
              <option value="random">{isAr ? 'عشوائي' : 'Random'}</option>
            </select>
          </div>
          <button onClick={addSugar} className={`${s.btnPrimary} !h-10 !px-4 text-sm`}>+</button>
        </div>
        {sugar.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
            {sugar.map((r, i) => {
              const val = parseInt(r.value);
              const high = r.timing === 'fasting' ? val > 126 : val > 200;
              return (
                <div key={i} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2 text-sm">
                  <span className={`font-bold ${high ? 'text-red-400' : 'text-emerald-400'}`}>{r.value} mg/dL</span>
                  <span className="text-slate-400">{r.timing === 'fasting' ? (isAr ? 'صائم' : 'Fasting') : r.timing === 'postprandial' ? (isAr ? 'بعد الأكل' : 'Post-meal') : (isAr ? 'عشوائي' : 'Random')} • {r.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </InnerCard>

      {/* Lab Panel */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" /> {isAr ? 'التحاليل المعملية الأساسية' : 'Basic Lab Panel'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'hb', label: 'Hb', unit: 'g/dL', arLabel: 'هيموجلوبين' },
            { key: 'wbc', label: 'WBC', unit: '×10³', arLabel: 'كرات بيضاء' },
            { key: 'plt', label: 'PLT', unit: '×10³', arLabel: 'صفائح دموية' },
            { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', arLabel: 'كرياتينين' },
            { key: 'urea', label: 'Urea', unit: 'mg/dL', arLabel: 'يوريا' },
            { key: 'alt', label: 'ALT', unit: 'U/L', arLabel: 'إنزيم الكبد ALT' },
            { key: 'ast', label: 'AST', unit: 'U/L', arLabel: 'إنزيم الكبد AST' },
          ].map(lab => (
            <div key={lab.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">{isAr ? lab.arLabel : lab.label}</label>
              <div className="flex items-center gap-1">
                <input className={`${s.inputSm} !h-9 text-center`} placeholder="—" value={labs[lab.key]}
                  onChange={e => setLabs(p => ({ ...p, [lab.key]: e.target.value }))} />
                <span className="text-[10px] text-slate-600 font-bold shrink-0">{lab.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </InnerCard>
    </div>
  );
}
