'use client';

import React from 'react';
import { Mic, Radio } from 'lucide-react';

export default function VoiceSelection({
  voice,
  setVoice,
  vocalEnhancer,
  setVocalEnhancer
}) {
  return (
    <div className="bg-editor-card border border-editor-border rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-editor-orange" />
          Khmer Neural Voice
        </label>
        <span className="text-[10px] text-zinc-500 font-mono">edge-tts</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Male: Piseth */}
        <button
          type="button"
          onClick={() => setVoice('km-KH-PisethNeural')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            voice === 'km-KH-PisethNeural'
              ? 'border-editor-orange bg-editor-orangeDim text-white font-bold'
              : 'border-editor-border bg-zinc-900/60 text-zinc-400 hover:border-editor-borderHover'
          }`}
        >
          <span className="text-xs">Piseth</span>
          <span className="px-1 py-0.5 text-[9px] font-mono rounded bg-orange-500/20 text-editor-orange font-bold">M</span>
        </button>

        {/* Female: Sreymom */}
        <button
          type="button"
          onClick={() => setVoice('km-KH-SreymomNeural')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            voice === 'km-KH-SreymomNeural'
              ? 'border-editor-orange bg-editor-orangeDim text-white font-bold'
              : 'border-editor-border bg-zinc-900/60 text-zinc-400 hover:border-editor-borderHover'
          }`}
        >
          <span className="text-xs">Sreymom</span>
          <span className="px-1 py-0.5 text-[9px] font-mono rounded bg-zinc-800 text-zinc-400 font-medium">F</span>
        </button>
      </div>

      {/* Real Human Studio Warmth & Vocal Enhancer */}
      <div className="pt-2 border-t border-editor-border/60 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white flex items-center gap-1">
            <Radio className="w-3 h-3 text-editor-orange" />
            Audio Profile
          </span>
        </div>
        <select
          value={vocalEnhancer}
          onChange={(e) => setVocalEnhancer(e.target.value)}
          className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
        >
          <option value="studio_human">🎙️ Studio Human</option>
          <option value="dramatic_movie">🎬 Cinema Narrator</option>
          <option value="warm_storyteller">📖 Storyteller</option>
          <option value="raw">🤖 Raw Voice</option>
        </select>
      </div>
    </div>
  );
}
