import { useState } from 'react';
import { Activity, Zap, ShieldAlert, Timer, Compass, Dumbbell } from 'lucide-react';
import { InnerCard, s } from '../components/shared';

const EXERCISES = [
  { id: 'cervical_retraction', en: 'Cervical Retraction (Chin Tucks)', ar: 'تمرين سحب الذقن (لتعديل وضع الرقبة)' },
  { id: 'lumbar_mckenzie',     en: 'Lumbar Extension (McKenzie)', ar: 'تمديد الظهر (تمارين ماكنزي)' },
  { id: 'shoulder_ext_rot',    en: 'Shoulder External Rotation', ar: 'الدوران الخارجي لمفصل الكتف' },
  { id: 'wall_slides',         en: 'Wall Slides / Scapular Squeezes', ar: 'تمرين الانزلاق على الحائط وتقريب اللوحين' },
  { id: 'hamstring_stretch',   en: 'Passive Hamstring Stretch', ar: 'إطالة العضلة الخلفية للساق' },
  { id: 'ankle_pumps',         en: 'Ankle Pumps & Mobilization', ar: 'تمارين تحريك وتنشيط الكاحل' }
];

const MODALITIES = [
  { id: 'tens',          en: 'TENS (Electrical Stimulation)', ar: 'التحفيز الكهربائي لتسكين الألم (TENS)', type: 'electro' },
  { id: 'ems',          en: 'EMS (Muscle Stimulation)',      ar: 'تحفيز العضلات الكهربائي (EMS)',           type: 'electro' },
  { id: 'ultrasound',   en: 'Therapeutic Ultrasound',        ar: 'العلاج بالموجات فوق الصوتية',            type: 'thermal' },
  { id: 'laser',        en: 'High-Power Laser Therapy',      ar: 'العلاج بالليزر عالي الطاقة',             type: 'optical' },
  { id: 'manual',       en: 'Manual Mobilization / Traction', ar: 'العلاج اليدوي / شد الفقرات الميكانيكي',    type: 'manual' },
  { id: 'hot_cold',     en: 'Contrast Thermotherapy (Packs)', ar: 'العلاج الحراري (كمادات ساخنة/باردة)',      type: 'thermal' }
];

export default function PhysicalTherapyModule({ t }) {
  const isAr = t('appTitle') !== 'Our Clinic 3D';
  
  // State for Range of Motion (ROM)
  const [flexion, setFlexion] = useState(90);
  const [extension, setExtension] = useState(0);
  const [abduction, setAbduction] = useState(45);
  
  // State for Modalities & Duration
  const [selectedModalities, setSelectedModalities] = useState([]);
  const [sessionDuration, setSessionDuration] = useState(20);
  const [tensIntensity, setTensIntensity] = useState(15); // mA

  // State for Home Exercises
  const [prescribedExercises, setPrescribedExercises] = useState([]);

  const toggleModality = (id) => {
    setSelectedModalities(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleExercise = (id) => {
    setPrescribedExercises(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Range of Motion (ROM) Tracker */}
      <InnerCard className="flex flex-col gap-4">
        <h3 className="font-black text-white flex items-center gap-2 text-lg">
          <Compass className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
          {isAr ? 'نطاق حركة المفاصل (ROM)' : 'Joint Range of Motion (ROM)'}
        </h3>
        
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {/* Flexion */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">{isAr ? 'انثناء (Flexion)' : 'Flexion'}</span>
              <span className="font-black text-cyan-400 text-sm">{flexion}°</span>
            </div>
            <input 
              type="range" min="0" max="180" value={flexion}
              onChange={e => setFlexion(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-0.5">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
            </div>
          </div>

          {/* Extension */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">{isAr ? 'تمديد / فرد (Extension)' : 'Extension'}</span>
              <span className="font-black text-fuchsia-400 text-sm">{extension}°</span>
            </div>
            <input 
              type="range" min="-30" max="90" value={extension}
              onChange={e => setExtension(Number(e.target.value))}
              className="w-full accent-fuchsia-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-0.5">
              <span>-30°</span>
              <span>0°</span>
              <span>90°</span>
            </div>
          </div>

          {/* Abduction */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">{isAr ? 'تبعيد / دوران (Abduction / Rotation)' : 'Abduction / Rotation'}</span>
              <span className="font-black text-emerald-400 text-sm">{abduction}°</span>
            </div>
            <input 
              type="range" min="0" max="180" value={abduction}
              onChange={e => setAbduction(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-0.5">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
            </div>
          </div>
        </div>
      </InnerCard>

      {/* Therapy Modalities (أجهزة وجلسات التأهيل) */}
      <InnerCard className="flex flex-col gap-4">
        <h3 className="font-black text-white flex items-center gap-2 text-lg">
          <Zap className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" />
          {isAr ? 'أجهزة وجلسات العلاج الطبيعي بالعيادة' : 'Clinical Physiotherapy Modalities'}
        </h3>
        
        <div className="flex flex-wrap gap-2 flex-1 items-start">
          {MODALITIES.map(mod => {
            const isSelected = selectedModalities.includes(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => toggleModality(mod.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-start flex-1 sm:flex-none min-w-[140px]
                  ${isSelected
                    ? 'bg-amber-500/10 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 border-white/5'}`}
              >
                {isAr ? mod.ar : mod.en}
              </button>
            );
          })}
        </div>

        {/* Dynamic Modality Controls */}
        <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-400" />
              {isAr ? `زمن الجلسة المقترح: ${sessionDuration} دقيقة` : `Suggested Duration: ${sessionDuration} mins`}
            </span>
            <input 
              type="range" min="5" max="60" step="5" value={sessionDuration}
              onChange={e => setSessionDuration(Number(e.target.value))}
              className="w-full sm:w-32 accent-amber-400 cursor-pointer"
            />
          </div>

          {(selectedModalities.includes('tens') || selectedModalities.includes('ems')) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl animate-in slide-in-from-top-1">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                {isAr ? `شدة التحفيز الكهربائي: ${tensIntensity} مللي أمبير` : `Stimulation Intensity: ${tensIntensity} mA`}
              </span>
              <input 
                type="range" min="1" max="50" value={tensIntensity}
                onChange={e => setTensIntensity(Number(e.target.value))}
                className="w-full sm:w-32 accent-amber-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      </InnerCard>

      {/* Rehabilitation Home Exercises Checklist */}
      <InnerCard className="flex flex-col gap-4 lg:col-span-2">
        <h3 className="font-black text-white flex items-center gap-2 text-lg">
          <Dumbbell className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] shrink-0" />
          {isAr ? 'برنامج التمرينات المنزلية للمريض' : 'Prescribed Home Exercise Program (HEP)'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {EXERCISES.map(ex => {
            const isChecked = prescribedExercises.includes(ex.id);
            return (
              <label 
                key={ex.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none
                  ${isChecked ? 'bg-purple-900/20 border-purple-500/40 shadow-inner' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
              >
                <input 
                  type="checkbox" 
                  checked={isChecked} 
                  onChange={() => toggleExercise(ex.id)}
                  className="accent-purple-400 w-4.5 h-4.5 rounded" 
                />
                <div>
                  <span className="font-black text-slate-200 text-sm">
                    {isAr ? ex.ar : ex.en}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </InnerCard>

    </div>
  );
}
