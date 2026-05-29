import { useState } from 'react';
import { Activity, Calculator, Thermometer, Stethoscope } from 'lucide-react';
import { InnerCard, s } from '../components/shared';

const EXAM_ITEMS = [
  { id: 'general_appearance', en: 'General Appearance', ar: 'المظهر العام' },
  { id: 'consciousness',     en: 'Consciousness',      ar: 'مستوى الوعي' },
  { id: 'skin_color',        en: 'Skin Color',         ar: 'لون البشرة' },
  { id: 'hydration',         en: 'Hydration Status',   ar: 'حالة الترطيب' },
  { id: 'lymph_nodes',       en: 'Lymph Nodes',        ar: 'الغدد الليمفاوية' },
  { id: 'thyroid',           en: 'Thyroid',             ar: 'الغدة الدرقية' },
];

export default function GeneralModule({ t }) {
  const isAr = t('appTitle') !== 'Our Clinic 3D';
  const [vitals, setVitals] = useState({ temp: '', hr: '', bp_sys: '', bp_dia: '', rr: '', spo2: '', weight: '', height: '' });
  const [examFindings, setExamFindings] = useState({});

  const bmi = vitals.weight && vitals.height
    ? (parseFloat(vitals.weight) / Math.pow(parseFloat(vitals.height) / 100, 2)).toFixed(1)
    : null;
  const bmiCategory = bmi ? (bmi < 18.5 ? (isAr ? 'نقص وزن' : 'Underweight') : bmi < 25 ? (isAr ? 'طبيعي' : 'Normal') : bmi < 30 ? (isAr ? 'وزن زائد' : 'Overweight') : (isAr ? 'سمنة' : 'Obese')) : '';
  const bmiColor = bmi ? (bmi < 18.5 ? 'text-amber-400' : bmi < 25 ? 'text-emerald-400' : bmi < 30 ? 'text-amber-400' : 'text-red-400') : '';

  const VitalInput = ({ label, field, unit, placeholder }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <div className="flex items-center gap-1">
        <input className={`${s.inputSm} !h-9 text-center`} placeholder={placeholder} value={vitals[field]}
          onChange={e => setVitals(p => ({ ...p, [field]: e.target.value }))} />
        {unit && <span className="text-xs text-slate-500 font-bold shrink-0">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Vitals */}
      <InnerCard className="flex flex-col gap-4">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-cyan-400" /> {isAr ? 'العلامات الحيوية' : 'Vital Signs'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <VitalInput label={isAr ? 'الحرارة' : 'Temp'} field="temp" unit="°C" placeholder="37.0" />
          <VitalInput label={isAr ? 'النبض' : 'HR'} field="hr" unit="bpm" placeholder="72" />
          <VitalInput label={isAr ? 'ض.دم (انقباضي)' : 'SBP'} field="bp_sys" unit="mmHg" placeholder="120" />
          <VitalInput label={isAr ? 'ض.دم (انبساطي)' : 'DBP'} field="bp_dia" unit="mmHg" placeholder="80" />
          <VitalInput label={isAr ? 'التنفس' : 'RR'} field="rr" unit="/min" placeholder="16" />
          <VitalInput label={isAr ? 'تشبع الأكسجين' : 'SpO2'} field="spo2" unit="%" placeholder="98" />
          <VitalInput label={isAr ? 'الوزن' : 'Weight'} field="weight" unit="kg" placeholder="70" />
          <VitalInput label={isAr ? 'الطول' : 'Height'} field="height" unit="cm" placeholder="170" />
        </div>
      </InnerCard>

      {/* BMI Calculator */}
      {bmi && (
        <InnerCard className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white">{isAr ? 'مؤشر كتلة الجسم (BMI)' : 'Body Mass Index (BMI)'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-black ${bmiColor}`}>{bmi}</span>
            <span className={`${s.badge} ${bmiColor.replace('text-', '!text-')}`}>{bmiCategory}</span>
          </div>
        </InnerCard>
      )}

      {/* General Examination */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-emerald-400" /> {isAr ? 'الفحص السريري العام' : 'General Physical Examination'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAM_ITEMS.map(item => (
            <div key={item.id} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">{isAr ? item.ar : item.en}</label>
              <select className={`${s.inputSm} !h-9`} value={examFindings[item.id] || ''}
                onChange={e => setExamFindings(p => ({ ...p, [item.id]: e.target.value }))}>
                <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                <option value="normal">{isAr ? 'طبيعي ✅' : 'Normal ✅'}</option>
                <option value="abnormal">{isAr ? 'غير طبيعي ⚠️' : 'Abnormal ⚠️'}</option>
              </select>
            </div>
          ))}
        </div>
      </InnerCard>
    </div>
  );
}
