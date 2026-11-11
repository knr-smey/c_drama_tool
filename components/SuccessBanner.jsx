'use client';

import React from 'react';
import { Check, Play, Folder } from 'lucide-react';

export default function SuccessBanner({
  completedData,
  onPlayVideo,
  onRevealFile
}) {
  if (!completedData) return null;

  return (
    <div className="bg-white dark:bg-[#15161e] border-2 border-emerald-500/80 rounded-2xl p-5 shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Dubbing Pipeline Complete!
              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full font-mono font-bold">
                {completedData.time || 'Finished'}
              </span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-mono break-all">
              {completedData.outputPath || '-'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Size: {completedData.fileSize || '0 MB'}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>Duration: {completedData.duration || '00:00'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPlayVideo}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-dash-orange hover:bg-orange-600 text-white flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Play Video
          </button>
          <button
            onClick={onRevealFile}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-[#1f212b] hover:bg-zinc-200 dark:hover:bg-[#282a36] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#2a2d39] flex items-center gap-1.5 transition-all"
          >
            <Folder className="w-3.5 h-3.5 text-dash-orange" />
            Reveal
          </button>
        </div>
      </div>
    </div>
  );
}
