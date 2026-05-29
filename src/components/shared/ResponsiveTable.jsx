import { useState } from 'react';
import { useClinic } from '../../contexts/ClinicContext';

export default function ResponsiveTable({ headers, data = [], renderRow, renderCard, emptyMessage }) {
  const { isAr } = useClinic();
  const [limit, setLimit] = useState(5);

  const hasData = data && data.length > 0;

  if (!hasData) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold italic bg-black/10 dark:bg-black/30 rounded-2xl border border-emerald-500/5 dark:border-white/5">
        {emptyMessage || (isAr ? 'لا توجد بيانات متاحة' : 'No data available')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout (Visible on screens < 768px) */}
      <div className="block md:hidden space-y-4">
        {data.slice(0, limit).map((item, idx) => renderCard(item, idx))}
        
        {data.length > limit && (
          <button
            type="button"
            onClick={() => setLimit(prev => Math.min(prev + 5, data.length))}
            className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-cyan-400 font-black rounded-xl border border-emerald-500/20 text-sm transition-all duration-200"
          >
            {isAr ? `عرض المزيد (+${data.length - limit})` : `Show More (+${data.length - limit})`}
          </button>
        )}
      </div>

      {/* Desktop Responsive Table (Visible on screens >= 768px) */}
      <div className="hidden md:block overflow-x-auto w-full border border-emerald-500/10 dark:border-white/5 rounded-2xl shadow-inner bg-black/10 dark:bg-black/30">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-emerald-500/10 dark:border-white/10 bg-emerald-500/5 dark:bg-black/40 text-emerald-800 dark:text-slate-300 font-black text-sm">
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-4 text-start whitespace-nowrap font-black">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/5 dark:divide-white/5 text-emerald-950 dark:text-slate-100 text-sm font-semibold">
            {data.map((item, idx) => renderRow(item, idx))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
