import { HeartPulse, Activity } from 'lucide-react';
import { InnerCard, Input, s } from '../components/shared';

export default function CardiologyModule({ t }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <InnerCard className="flex flex-col h-[280px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-white flex items-center gap-2 text-lg">
            <HeartPulse className="w-6 h-6 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] shrink-0" />
            {t('ecgReports')}
          </h3>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
        </div>
        <div className="bg-black/60 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden shadow-inner border border-white/5 flex-1">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px,transparent 1px),linear-gradient(90deg,#333 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <svg viewBox="0 0 500 100" className="w-full h-full stroke-red-500 fill-none z-10" style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.8))' }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0,50 L50,50 L60,20 L70,80 L80,10 L90,90 L100,50 L150,50 L160,20 L170,80 L180,10 L190,90 L200,50 L500,50" />
          </svg>
        </div>
      </InnerCard>

      <InnerCard className="flex flex-col h-[280px]">
        <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg">
          <Activity className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
          {t('lipidProfile')}
        </h3>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <Input label={t('cholesterol')}  placeholder="mg/dL" className={s.inputSm} />
          <Input label={t('ldl')}          placeholder="mg/dL" className={s.inputSm} />
          <Input label={t('hdl')}          placeholder="mg/dL" className={s.inputSm} />
          <Input label={t('triglycerides')} placeholder="mg/dL" className={s.inputSm} />
        </div>
      </InnerCard>
    </div>
  );
}
