import { useState } from 'react';
import { Baby, FileImage, UploadCloud } from 'lucide-react';
import { InnerCard, Input, s } from '../components/shared';

function calcGA(lmp) {
  if (!lmp) return { weeks: 0, days: 0, edd: '' };
  const msPerDay = 86400000;
  const diff = Date.now() - new Date(lmp).getTime();
  const totalDays = Math.floor(diff / msPerDay);
  const edd = new Date(new Date(lmp).getTime() + 280 * msPerDay).toLocaleDateString('en-GB');
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, edd };
}

export default function OBGYNModule({ t }) {
  const [lmp, setLmp] = useState('');
  const ga = calcGA(lmp);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <Baby className="w-6 h-6 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
          {t('pregnancyTimeline')}
        </h3>
        <div className="flex flex-col gap-4 flex-1">
          <Input label={t('lmp')} type="date" value={lmp}
            onChange={e => setLmp(e.target.value)} className={s.inputSm} />
          <div className="flex-1 bg-black/40 rounded-2xl shadow-inner border border-white/5 flex flex-col items-center justify-center">
            {lmp ? (
              <>
                <span className="text-5xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]">
                  {ga.weeks}<span className="text-xl text-rose-200">w</span>&nbsp;
                  {ga.days}<span className="text-xl text-rose-200">d</span>
                </span>
                <span className="text-sm font-bold text-slate-300 mt-2 bg-black/50 px-3 py-1 rounded-full">
                  {t('edd')}: <span className="text-white">{ga.edd}</span>
                </span>
              </>
            ) : (
              <span className="text-slate-500 font-bold">Enter LMP date</span>
            )}
          </div>
        </div>
      </InnerCard>

      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <FileImage className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          {t('ultrasound')}
        </h3>
        <div className="flex gap-4 flex-1">
          <div className="w-1/2 bg-black/80 rounded-2xl overflow-hidden border border-white/10 relative">
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80"
              alt="USG"
              className="w-full h-full object-cover opacity-70 mix-blend-screen"
            />
            <span className="absolute bottom-2 end-2 bg-black/80 text-cyan-400 text-xs px-2 py-1 rounded font-bold">20W</span>
          </div>
          <div className="w-1/2 bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center font-bold text-indigo-400 border-2 border-dashed border-indigo-500/50 cursor-pointer hover:bg-indigo-900/40 transition-colors">
            <UploadCloud className="w-8 h-8 mb-2" /> Add Scan
          </div>
        </div>
      </InnerCard>
    </div>
  );
}
