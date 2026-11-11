'use client';

import React from 'react';
import { Clapperboard } from 'lucide-react';

export default function ProductionStyle({ mode, setMode }) {
  return (
    <div className="bg-editor-card border border-editor-border rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5 text-editor-orange" />
          Production Style / ទម្រង់ផលិត
        </label>
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-orange-500/10 text-editor-orange border border-editor-orange/30 rounded">
          Mode
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Mode 1: Drama Recap & Storyteller */}
        <div
          onClick={() => setMode('recap')}
          className={`mode-card relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
            mode === 'recap'
              ? 'border-editor-orange bg-editor-orangeDim shadow-sm shadow-orange-500/10'
              : 'border-editor-border bg-zinc-900/60 hover:border-editor-borderHover'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              🎬 សង្ខេបរឿង
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-editor-orange text-black rounded font-mono">
              RECAP
            </span>
          </div>
          <div className="font-bold text-xs text-white">Drama Recap</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
            AI narrates the plot with background SFX/music ducking
          </div>
        </div>

        {/* Mode 2: Direct Dialogue Dubbing */}
        <div
          onClick={() => setMode('direct')}
          className={`mode-card relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
            mode === 'direct'
              ? 'border-editor-orange bg-editor-orangeDim shadow-sm shadow-orange-500/10'
              : 'border-editor-border bg-zinc-900/60 hover:border-editor-borderHover'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
              🎙️ បញ្ចូលសំឡេង
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-zinc-800 text-zinc-400 rounded font-mono">
              1:1
            </span>
          </div>
          <div className="font-bold text-xs text-white">Direct Dubbing</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
            Line-by-line speech with sentence lip-sync matching
          </div>
        </div>
      </div>
    </div>
  );
}
