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
    <div className="bg-editor-panel border border-editor-orange rounded-xl p-4 shadow-xl transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-editor-orange text-black flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Dubbing Pipeline Complete!
              <span className="px-2 py-0.5 text-[10px] bg-orange-500/20 text-editor-orange rounded font-mono">
                {completedData.time || 'Finished'}
              </span>
            </h3>
            <p className="text-xs text-zinc-300 mt-1 font-mono break-all">
              {completedData.outputPath || '-'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 font-mono">
              <span>Size: {completedData.fileSize || '0 MB'}</span>
              <span className="text-zinc-600">•</span>
              <span>Duration: {completedData.duration || '00:00'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPlayVideo}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-editor-orange hover:bg-editor-orangeHover text-black flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            Play Video
          </button>
          <button
            onClick={onRevealFile}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-editor-border hover:border-editor-borderHover flex items-center gap-1.5 transition-all"
          >
            <Folder className="w-3.5 h-3.5 text-editor-orange" />
            Show in Folder
          </button>
        </div>
      </div>
    </div>
  );
}
