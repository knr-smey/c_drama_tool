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
    <div className="bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-dash-orange" />
          Neural Voice
        </label>
        <span className="text-[10px] text-zinc-400 font-mono">edge-tts</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Male: Piseth */}
        <button
          type="button"
          onClick={() => setVoice('km-KH-PisethNeural')}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            voice === 'km-KH-PisethNeural'
              ? 'border-dash-orange bg-orange-50/70 dark:bg-orange-500/15 text-zinc-900 dark:text-white font-bold shadow-xs'
              : 'border-[#e5e1d8] dark:border-[#2a2c38] bg-[#faf9f5] dark:bg-[#1a1c24] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
          }`}
        >
          <span className="text-xs">Piseth</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-dash-orange text-white font-bold">M</span>
        </button>

        {/* Female: Sreymom */}
        <button
          type="button"
          onClick={() => setVoice('km-KH-SreymomNeural')}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            voice === 'km-KH-SreymomNeural'
              ? 'border-dash-orange bg-orange-50/70 dark:bg-orange-500/15 text-zinc-900 dark:text-white font-bold shadow-xs'
              : 'border-[#e5e1d8] dark:border-[#2a2c38] bg-[#faf9f5] dark:bg-[#1a1c24] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
          }`}
        >
          <span className="text-xs">Sreymom</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">F</span>
        </button>
      </div>

      {/* Real Human Studio Warmth & Vocal Enhancer */}
      <div className="pt-2 border-t border-[#f0ece4] dark:border-[#242630] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
            <Radio className="w-3 h-3 text-dash-orange" />
            Audio Profile
          </span>
        </div>
        <select
          value={vocalEnhancer}
          onChange={(e) => setVocalEnhancer(e.target.value)}
          className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2c38] focus:border-dash-orange focus:bg-white dark:focus:bg-[#15161e] text-xs text-zinc-900 dark:text-white rounded-xl px-3 py-2 outline-none font-mono"
        >
          <option value="studio_human">🎙️ Studio Human (Warm + Breathing)</option>
          <option value="dramatic_movie">🎬 Cinema Narrator (Deep Tone)</option>
          <option value="warm_storyteller">📖 Storyteller (Smooth)</option>
          <option value="raw">🤖 Raw Voice</option>
        </select>
      </div>
    </div>
  );
}
