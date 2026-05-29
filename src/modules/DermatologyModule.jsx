import { useState } from 'react';
import { Palette, AlertTriangle, MapPin } from 'lucide-react';
import { InnerCard, s } from '../components/shared';

const LESION_TYPES = [
  { en: 'Macule', ar: 'بقعة مسطحة' }, { en: 'Papule', ar: 'حطاطة' }, { en: 'Nodule', ar: 'عقيدة' },
  { en: 'Vesicle', ar: 'حويصلة' }, { en: 'Bulla', ar: 'فقاعة' }, { en: 'Pustule', ar: 'بثرة' },
  { en: 'Plaque', ar: 'لويحة' }, { en: 'Patch', ar: 'رقعة' }, { en: 'Wheal', ar: 'شرى' },
  { en: 'Ulcer', ar: 'قرحة' }, { en: 'Erosion', ar: 'تآكل' }, { en: 'Crust', ar: 'قشرة' },
];

const BODY_LOCATIONS = [
  { en: 'Face', ar: 'الوجه' }, { en: 'Scalp', ar: 'فروة الرأس' }, { en: 'Neck', ar: 'الرقبة' },
  { en: 'Chest', ar: 'الصدر' }, { en: 'Back', ar: 'الظهر' }, { en: 'Abdomen', ar: 'البطن' },
  { en: 'Arms', ar: 'الذراعان' }, { en: 'Hands', ar: 'اليدان' }, { en: 'Legs', ar: 'الساقان' },
  { en: 'Feet', ar: 'القدمان' }, { en: 'Groin', ar: 'المنطقة الإربية' }, { en: 'Nails', ar: 'الأظافر' },
];

export default function DermatologyModule({ t }) {
  const isAr = t('appTitle') !== 'Our Clinic 3D';
  const [lesion, setLesion] = useState({ type: '', color: '', size: '', shape: '', distribution: '', locations: [] });
  const [abcde, setAbcde] = useState({ A: false, B: false, C: false, D: false, E: false });

  const abcdeItems = [
    { key: 'A', en: 'Asymmetry', ar: 'عدم التماثل', desc: isAr ? 'هل الشكل غير متماثل؟' : 'Is the shape asymmetrical?' },
    { key: 'B', en: 'Border irregularity', ar: 'حواف غير منتظمة', desc: isAr ? 'هل الحواف مشرشرة أو غير واضحة؟' : 'Are borders jagged or blurred?' },
    { key: 'C', en: 'Color variation', ar: 'تعدد الألوان', desc: isAr ? 'هل يوجد أكثر من لون؟' : 'Multiple colors present?' },
    { key: 'D', en: 'Diameter > 6mm', ar: 'القطر > 6مم', desc: isAr ? 'هل القطر أكبر من 6 مم؟' : 'Is diameter larger than 6mm?' },
    { key: 'E', en: 'Evolving', ar: 'تغير مع الوقت', desc: isAr ? 'هل يتغير الحجم أو الشكل أو اللون؟' : 'Is it changing in size, shape, or color?' },
  ];
  const abcdeScore = Object.values(abcde).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Lesion Description */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-fuchsia-400" /> {isAr ? 'وصف الآفة الجلدية' : 'Skin Lesion Description'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">{isAr ? 'نوع الآفة' : 'Lesion Type'}</label>
            <select className={`${s.inputSm} !h-9`} value={lesion.type} onChange={e => setLesion(p => ({ ...p, type: e.target.value }))}>
              <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
              {LESION_TYPES.map(lt => <option key={lt.en} value={lt.en}>{isAr ? lt.ar : lt.en}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">{isAr ? 'اللون' : 'Color'}</label>
            <select className={`${s.inputSm} !h-9`} value={lesion.color} onChange={e => setLesion(p => ({ ...p, color: e.target.value }))}>
              <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
              {[
                { en: 'Red (Erythematous)', ar: 'أحمر' }, { en: 'Brown (Hyperpigmented)', ar: 'بني' },
                { en: 'White (Hypopigmented)', ar: 'أبيض' }, { en: 'Black', ar: 'أسود' },
                { en: 'Yellow', ar: 'أصفر' }, { en: 'Purple (Violaceous)', ar: 'بنفسجي' },
              ].map(c => <option key={c.en} value={c.en}>{isAr ? c.ar : c.en}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">{isAr ? 'الحجم' : 'Size'}</label>
            <input className={`${s.inputSm} !h-9`} placeholder={isAr ? '2×3 سم' : '2×3 cm'} value={lesion.size}
              onChange={e => setLesion(p => ({ ...p, size: e.target.value }))} />
          </div>
        </div>
      </InnerCard>

      {/* Body Location */}
      <InnerCard className="flex flex-col gap-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" /> {isAr ? 'موقع الإصابة' : 'Body Location'}
        </h4>
        <div className="flex flex-wrap gap-2">
          {BODY_LOCATIONS.map(loc => {
            const active = lesion.locations.includes(loc.en);
            return (
              <button key={loc.en}
                onClick={() => setLesion(p => ({
                  ...p,
                  locations: active ? p.locations.filter(l => l !== loc.en) : [...p.locations, loc.en]
                }))}
                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all
                  ${active ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50' : 'bg-black/30 text-slate-400 border-white/5 hover:border-fuchsia-400/30'}`}>
                {isAr ? loc.ar : loc.en}
              </button>
            );
          })}
        </div>
      </InnerCard>

      {/* ABCDE Melanoma Check */}
      <InnerCard className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> {isAr ? 'فحص ABCDE للميلانوما' : 'ABCDE Melanoma Check'}
          </h4>
          {abcdeScore >= 3 && (
            <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/40">
              ⚠️ {isAr ? 'يحتاج تقييم عاجل' : 'Needs urgent evaluation'}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {abcdeItems.map(item => (
            <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${abcde[item.key] ? 'bg-red-900/20 border-red-500/40' : 'bg-black/20 border-white/5 hover:border-white/15'}`}>
              <input type="checkbox" checked={abcde[item.key]} onChange={e => setAbcde(p => ({ ...p, [item.key]: e.target.checked }))}
                className="accent-red-400 w-4 h-4" />
              <div>
                <span className="font-bold text-white">
                  <span className="text-red-400">{item.key}</span> — {isAr ? item.ar : item.en}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </InnerCard>
    </div>
  );
}
