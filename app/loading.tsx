import React from 'react';

export default function Loading() {
  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-between p-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
      aria-busy="true"
      aria-label="Loading LearnFlow workspace"
    >
      <div className="max-w-[1120px] w-full mx-auto space-y-6">
        <div
          className="h-14 w-full rounded-2xl animate-pulse"
          style={{ backgroundColor: 'var(--card)' }}
        />
        <div
          className="h-[420px] w-full rounded-[32px] p-8 flex flex-col justify-between animate-pulse"
          style={{ backgroundColor: 'var(--bl)' }}
        >
          <div className="w-40 h-5 rounded-full bg-white/40" />
          <div className="w-3/5 h-24 rounded-3xl bg-white/55" />
          <div className="flex justify-between items-end">
            <div className="w-64 h-10 rounded-2xl bg-black/10" />
            <div className="w-40 h-12 rounded-full bg-black/15" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-3xl animate-pulse"
              style={{ backgroundColor: 'var(--card)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
