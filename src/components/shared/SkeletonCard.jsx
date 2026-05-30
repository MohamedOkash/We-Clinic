import React from 'react';

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-slate-200/30 dark:bg-slate-900/50 border border-slate-300/20 dark:border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-300/30 dark:bg-slate-800 rounded-xl w-1/3"></div>
              <div className="h-4 bg-slate-300/20 dark:bg-slate-800/60 rounded-lg w-2/3"></div>
            </div>
            <div className="w-10 h-10 bg-slate-300/20 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-px bg-slate-200/40 dark:bg-slate-800/40 my-2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-300/20 dark:bg-slate-800/50 rounded-lg w-full"></div>
            <div className="h-4 bg-slate-300/20 dark:bg-slate-800/50 rounded-lg w-5/6"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default SkeletonCard;
