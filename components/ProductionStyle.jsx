'use client';

import React from 'react';
import { Clapperboard } from 'lucide-react';

export default function ProductionStyle({ mode, setMode }) {
  return (
    <div className="bg-editor-card border border-editor-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5 text-editor-orange" />
          Style
        </label>
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-orange-500/10 text-editor-orange border border-editor-orange/30 rounded">
          Mode
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('recap')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            mode === 'recap'
              ? 'border-editor-orange bg-editor-orangeDim text-white font-bold'
              : 'border-editor-border bg-zinc-900/60 text-zinc-400 hover:border-editor-borderHover'
          }`}
        >
          <span className="text-xs">🎬 Recap</span>
          <span className="px-1 py-0.5 text-[9px] font-mono rounded bg-editor-orange text-black font-bold">AI</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('direct')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            mode === 'direct'
              ? 'border-editor-orange bg-editor-orangeDim text-white font-bold'
              : 'border-editor-border bg-zinc-900/60 text-zinc-400 hover:border-editor-borderHover'
          }`}
        >
          <span className="text-xs">🎙️ Dubbing</span>
          <span className="px-1 py-0.5 text-[9px] font-mono rounded bg-zinc-800 text-zinc-400 font-medium">1:1</span>
        </button>
      </div>
    </div>
  );
}
