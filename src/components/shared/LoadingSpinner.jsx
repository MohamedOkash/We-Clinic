import React from 'react';

export function LoadingSpinner({ fullScreen = false, text = '', message = '' }) {
  const loadingText = text || message;
  return (
    <div className={`flex flex-col items-center justify-center gap-4 transition-colors duration-300
      ${fullScreen ? 'fixed inset-0 bg-slate-950/80 z-[100] backdrop-blur-sm' : 'py-12'}`}>
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      {loadingText && <p className="text-sm text-slate-400 font-bold tracking-wide animate-pulse">{loadingText}</p>}
    </div>
  );
}

// Skeleton loading for Tables
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
      {/* Table Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="h-6 bg-slate-800 rounded w-1/4"></div>
        <div className="h-8 bg-slate-800 rounded w-24"></div>
      </div>
      
      {/* Table Rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid grid-cols-12 gap-4 py-3 border-b border-slate-800/40 last:border-0">
            {Array.from({ length: cols }).map((_, cIdx) => {
              const widths = ['w-full', 'w-3/4', 'w-5/6', 'w-1/2'];
              const widthClass = widths[(rIdx + cIdx) % widths.length];
              return (
                <div 
                  key={cIdx} 
                  className={`h-4 bg-slate-800/70 rounded col-span-${Math.floor(12 / cols)} ${widthClass}`}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton loading for Chart Panel
export function ChartSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-1/4 mb-6"></div>
      <div className="w-full h-64 bg-slate-900 rounded-xl flex items-end justify-between p-4 space-x-3 rtl:space-x-reverse border border-slate-800/40">
        <div className="w-full bg-slate-800/40 rounded-t h-1/3"></div>
        <div className="w-full bg-slate-800/40 rounded-t h-1/2"></div>
        <div className="w-full bg-slate-800/40 rounded-t h-2/3"></div>
        <div className="w-full bg-slate-800/40 rounded-t h-2/5"></div>
        <div className="w-full bg-slate-800/40 rounded-t h-4/5"></div>
        <div className="w-full bg-slate-800/40 rounded-t h-3/5"></div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
