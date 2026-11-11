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
        <div
          onClick={() => setVoice('km-KH-PisethNeural')}
          className={`voice-card relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
            voice === 'km-KH-PisethNeural'
              ? 'border-editor-orange bg-editor-orangeDim'
              : 'border-editor-border bg-zinc-900/60 hover:border-editor-borderHover'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="w-6 h-6 rounded bg-editor-orange text-black font-extrabold text-xs flex items-center justify-center">
              P
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-500/20 text-editor-orange rounded font-mono">
              MALE
            </span>
          </div>
          <div className="font-bold text-xs text-white">Piseth Neural</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
            Natural male narration for drama & story
          </div>
        </div>

        {/* Female: Sreymom */}
        <div
          onClick={() => setVoice('km-KH-SreymomNeural')}
          className={`voice-card relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
            voice === 'km-KH-SreymomNeural'
              ? 'border-editor-orange bg-editor-orangeDim'
              : 'border-editor-border bg-zinc-900/60 hover:border-editor-borderHover'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 font-extrabold text-xs flex items-center justify-center">
              S
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-zinc-800 text-zinc-400 rounded font-mono">
              FEMALE
            </span>
          </div>
          <div className="font-bold text-xs text-white">Sreymom Neural</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
            Warm female voice for dialogue & recap
          </div>
        </div>
      </div>

      {/* Real Human Studio Warmth & Vocal Enhancer */}
      <div className="pt-2 border-t border-editor-border/60 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white flex items-center gap-1">
            <Radio className="w-3 h-3 text-editor-orange" />
            Human Realism Engine / សំឡេងមនុស្សពិត
          </span>
          <span className="text-[9px] font-mono font-bold text-editor-orange bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
            Studio Pro
          </span>
        </div>
        <select
          value={vocalEnhancer}
          onChange={(e) => setVocalEnhancer(e.target.value)}
          className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-editor-orange font-mono"
        >
          <option value="studio_human">🎙️ Studio Human Voice (Chest Warmth + Natural Breathing)</option>
          <option value="dramatic_movie">🎬 Dramatic Movie Narrator (Deep Cinema Tone + Reverb)</option>
          <option value="warm_storyteller">📖 Warm Storyteller (Intimate & Smooth)</option>
          <option value="raw">🤖 Standard Synthetic Voice (Dry / Unprocessed)</option>
        </select>
        <p className="text-[10px] text-zinc-500 leading-tight">
          Applies broadcast vocal EQ (warmth at 200Hz), de-essing, dynamic compression & natural breathing pauses.
        </p>
      </div>
    </div>
  );
}
