import React from 'react';

// Full Page loading view
export function LoadingSpinner({ message = '' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-sans">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated Brand Pulsing Logo */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing Back Rings */}
          <div className="absolute w-24 h-24 bg-cyan-500/10 rounded-full animate-ping duration-1000"></div>
          <div className="absolute w-16 h-16 bg-cyan-500/20 rounded-full animate-pulse"></div>
          
          {/* Main Logo Container */}
          <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-xl">
            <svg className="w-9 h-9 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {message && (
          <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
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
              // Varying widths for natural look
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

// Skeleton loading for Cards
export function CardSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800/60 rounded w-2/3"></div>
        </div>
        <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-px bg-slate-800/40 my-2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-800/50 rounded w-full"></div>
        <div className="h-4 bg-slate-800/50 rounded w-5/6"></div>
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
