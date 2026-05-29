import { useState } from 'react';
import { Scale, Syringe } from 'lucide-react';
import { InnerCard, Input, s } from '../components/shared';

export function PediatricsModule({ t }) {
  const [vaccines, setVaccines] = useState({ hepB: true, dtap: false, mmr: false });
  const toggle = (key) => setVaccines(prev => ({ ...prev, [key]: !prev[key] }));

  const vaxList = [
    { key: 'hepB', label: 'Hep B (Birth)' },
    { key: 'dtap', label: 'DTaP (2 Months)' },
    { key: 'mmr',  label: 'MMR (12 Months)' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <Scale className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          {t('growthChart')}
        </h3>
        <div className="flex gap-3 mb-4">
          <Input placeholder={t('weight')} className={s.inputSm} />
          <Input placeholder={t('height')} className={s.inputSm} />
        </div>
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-3 shadow-inner relative flex items-end">
          <svg viewBox="0 0 100 50" className="w-full h-full stroke-emerald-500"
            style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.8))' }}
            fill="none" strokeWidth="3" strokeLinecap="round">
            <path d="M0,45 Q20,40 40,25 T100,5" />
          </svg>
          <span className="absolute top-3 end-3 text-xs font-black text-slate-900 bg-emerald-400 px-2 py-1 rounded">75th</span>
        </div>
      </InnerCard>

      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <Syringe className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          {t('vaccines')}
        </h3>
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {vaxList.map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${vaccines[key] ? 'bg-black/20 border-white/5' : 'bg-yellow-900/20 border-yellow-500/50'}`}
            >
              <input type="checkbox" checked={vaccines[key]} onChange={() => toggle(key)}
                className="w-6 h-6 accent-yellow-500 rounded-lg" />
              <span className={`font-bold ${vaccines[key] ? 'line-through text-slate-500' : 'text-white'}`}>{label}</span>
            </label>
          ))}
        </div>
      </InnerCard>
    </div>
  );
}

export default PediatricsModule;
