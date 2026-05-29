import { useState } from 'react';
import { Brain, Zap, Eye, Hand } from 'lucide-react';
import { InnerCard, s } from '../components/shared';

const GCS_EYE =    [{ v: 4, en: 'Spontaneous', ar: 'تلقائي' }, { v: 3, en: 'To voice', ar: 'بالصوت' }, { v: 2, en: 'To pain', ar: 'بالألم' }, { v: 1, en: 'None', ar: 'لا يفتح' }];
const GCS_VERBAL = [{ v: 5, en: 'Oriented', ar: 'واعي ومتجه' }, { v: 4, en: 'Confused', ar: 'مشوش' }, { v: 3, en: 'Inappropriate words', ar: 'كلمات غير مناسبة' }, { v: 2, en: 'Incomprehensible sounds', ar: 'أصوات غير مفهومة' }, { v: 1, en: 'None', ar: 'لا يتكلم' }];
const GCS_MOTOR =  [{ v: 6, en: 'Obeys commands', ar: 'يطيع الأوامر' }, { v: 5, en: 'Localizing pain', ar: 'يحدد الألم' }, { v: 4, en: 'Withdrawal', ar: 'ينسحب' }, { v: 3, en: 'Abnormal flexion', ar: 'انثناء غير طبيعي' }, { v: 2, en: 'Extension', ar: 'بسط' }, { v: 1, en: 'None', ar: 'لا يتحرك' }];

const REFLEXES = ['Biceps', 'Triceps', 'Knee', 'Ankle', 'Plantar'];
const REFLEX_GRADES = ['0 (Absent)', '1+ (Diminished)', '2+ (Normal)', '3+ (Brisk)', '4+ (Clonus)'];

const CRANIAL_NERVES = [
  { id: 'II', en: 'Optic (Vision)', ar: 'البصري (الرؤية)' },
  { id: 'III,IV,VI', en: 'Eye Movement', ar: 'حركة العين' },
  { id: 'V', en: 'Trigeminal (Facial sensation)', ar: 'الثلاثي التوائم (إحساس الوجه)' },
  { id: 'VII', en: 'Facial (Expression)', ar: 'الوجهي (التعبيرات)' },
  { id: 'VIII', en: 'Vestibulocochlear (Hearing)', ar: 'السمعي (السمع والتوازن)' },
  { id: 'IX,X', en: 'Glossopharyngeal/Vagus', ar: 'البلعومي/المبهم (البلع)' },
  { id: 'XII', en: 'Hypoglossal (Tongue)', ar: 'تحت اللسان (اللسان)' },
];

export default function NeurologyModule({ t }) {
  const isAr = t('appTitle') !== 'Our Clinic 3D';
  const [gcs, setGcs] = useState({ eye: 4, verbal: 5, motor: 6 });
  const [reflexes, setReflexes] = useState({});
  const [cranialNerves, setCranialNerves] = useState({});

  const total = gcs.eye + gcs.verbal + gcs.motor;
  const severity = total >= 13 ? { label: isAr ? 'خفيف' : 'Mild', color: 'text-emerald-400 bg-emerald-500/20' }
    : total >= 9 ? { label: isAr ? 'متوسط' : 'Moderate', color: 'text-amber-400 bg-amber-500/20' }
    : { label: isAr ? 'شديد' : 'Severe', color: 'text-red-400 bg-red-500/20' };

  const GCSSelect = ({ label, icon: Icon, items, field }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
        <Icon className="w-4 h-4" /> {label}
      </label>
      <div className="flex flex-col gap-1">
        {items.map(item => (
          <button key={item.v} onClick={() => setGcs(p => ({ ...p, [field]: item.v }))}
            className={`text-start px-3 py-2 rounded-lg text-sm font-semibold transition-all ${gcs[field] === item.v
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              : 'bg-black/20 text-slate-400 border border-transparent hover:bg-white/5'}`}>
            <span className="font-black text-white me-2">{item.v}</span> {isAr ? item.ar : item.en}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* GCS Calculator */}
      <InnerCard className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" /> {isAr ? 'مقياس غلاسكو للغيبوبة (GCS)' : 'Glasgow Coma Scale (GCS)'}
          </h4>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black ${severity.color}`}>
            <span className="text-2xl">{total}</span>
            <span className="text-xs">/15 • {severity.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GCSSelect label={isAr ? 'فتح العين (E)' : 'Eye Opening (E)'} icon={Eye} items={GCS_EYE} field="eye" />
          <GCSSelect label={isAr ? 'الاستجابة اللفظية (V)' : 'Verbal Response (V)'} icon={Zap} items={GCS_VERBAL} field="verbal" />
          <GCSSelect label={isAr ? 'الاستجابة الحركية (M)' : 'Motor Response (M)'} icon={Hand} items={GCS_MOTOR} field="motor" />
        </div>
      </InnerCard>

      {/* Cranial Nerves */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> {isAr ? 'الأعصاب القحفية' : 'Cranial Nerves Examination'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CRANIAL_NERVES.map(cn => (
            <div key={cn.id} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-slate-300">
                <span className="text-cyan-400 font-black me-1.5">CN {cn.id}</span>
                {isAr ? cn.ar : cn.en}
              </span>
              <select className="bg-transparent text-xs font-bold text-slate-400 border-none focus:outline-none cursor-pointer"
                value={cranialNerves[cn.id] || ''} onChange={e => setCranialNerves(p => ({ ...p, [cn.id]: e.target.value }))}>
                <option value="">{isAr ? '—' : '—'}</option>
                <option value="intact">{isAr ? 'سليم ✅' : 'Intact ✅'}</option>
                <option value="deficit">{isAr ? 'عجز ⚠️' : 'Deficit ⚠️'}</option>
              </select>
            </div>
          ))}
        </div>
      </InnerCard>

      {/* Deep Tendon Reflexes */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white">{isAr ? 'المنعكسات الوترية العميقة' : 'Deep Tendon Reflexes'}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REFLEXES.map(ref => (
            <div key={ref} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-slate-300">{ref}</span>
              <div className="flex gap-1">
                {['R', 'L'].map(side => (
                  <select key={side} className="bg-black/40 text-xs text-slate-400 rounded px-2 py-1 border border-white/5"
                    value={reflexes[`${ref}_${side}`] || ''} onChange={e => setReflexes(p => ({ ...p, [`${ref}_${side}`]: e.target.value }))}>
                    <option value="">{side}</option>
                    {REFLEX_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ))}
              </div>
            </div>
          ))}
        </div>
      </InnerCard>
    </div>
  );
}
