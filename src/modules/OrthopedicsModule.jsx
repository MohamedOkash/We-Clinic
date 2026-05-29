import { useState } from 'react';
import { FileImage, Layers, Camera } from 'lucide-react';
import { InnerCard } from '../components/shared';

export default function OrthopedicsModule({ t, setDicomPreview }) {
  const [flexion,    setFlexion]    = useState(110);
  const [extension,  setExtension]  = useState(-5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {/* X-Ray */}
      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <FileImage className="w-6 h-6 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          {t('xrayManagement')}
        </h3>
        <div className="flex gap-4 flex-1 items-center overflow-x-auto pb-2">
          <div
            onClick={() => setDicomPreview('https://images.unsplash.com/photo-1516069677018-3798af4fc5aa?w=1000&q=80')}
            className="w-40 h-full bg-black/80 rounded-2xl flex items-center justify-center overflow-hidden relative group cursor-pointer border border-white/20 shrink-0"
          >
            <img
              src="https://images.unsplash.com/photo-1516069677018-3798af4fc5aa?w=300&q=80"
              alt="Knee MRI"
              className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 w-full h-full mix-blend-screen"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
              <span className="text-sm font-bold text-white">Knee MRI</span>
            </div>
          </div>
        </div>
      </InnerCard>

      {/* ROM */}
      <InnerCard className="h-[280px] flex flex-col">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          {t('rom')}
        </h3>
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {[{ label: t('flexion'), val: flexion, set: setFlexion, max: 150, color: 'cyan' },
            { label: t('extension'), val: extension, set: setExtension, min: -30, max: 30, color: 'fuchsia' }].map(({ label, val, set, min = 0, max, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-slate-300">{label}</span>
                <span className={`font-black text-${color}-400`}>{val}°</span>
              </div>
              <input type="range" min={min} max={max} value={val}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </InnerCard>

      {/* Compare */}
      <InnerCard className="h-[200px] flex flex-col lg:col-span-2">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <Layers className="w-6 h-6 text-purple-400" /> {t('compareImages')}
        </h3>
        <div className="flex gap-4 flex-1">
          <div className="w-1/2 bg-black/60 rounded-2xl flex items-center justify-center font-bold text-slate-500 shadow-inner border border-white/5">Before</div>
          <div className="w-1/2 bg-purple-900/20 rounded-2xl flex flex-col items-center justify-center font-bold text-purple-400 border-2 border-dashed border-purple-500/50 cursor-pointer hover:bg-purple-900/40 transition-colors">
            <Camera className="w-8 h-8 mb-2" /> Add After
          </div>
        </div>
      </InnerCard>
    </div>
  );
}
