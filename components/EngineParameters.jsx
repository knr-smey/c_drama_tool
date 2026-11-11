'use client';

import React, { useState } from 'react';
import { Sliders, Clock, Sparkles, Globe } from 'lucide-react';

export default function EngineParameters({
  whisperModel,
  setWhisperModel,
  speechRate,
  setSpeechRate,
  audioDelay,
  setAudioDelay,
  geminiKey,
  setGeminiKey,
  remuxMode,
  setRemuxMode,
  proxy,
  setProxy
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="bg-editor-card border border-editor-border rounded-xl p-3.5 space-y-3">
      <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
        <Sliders className="w-3.5 h-3.5 text-editor-orange" />
        Audio & Translation Engine
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Faster-Whisper Model */}
        <div>
          <span className="block text-[11px] font-medium text-zinc-400 mb-1">Whisper Model</span>
          <select
            value={whisperModel}
            onChange={(e) => setWhisperModel(e.target.value)}
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-editor-orange font-mono"
          >
            <option value="base">base (Fast CPU - int8)</option>
            <option value="small">small (Balanced - int8)</option>
            <option value="medium">medium (High Precision)</option>
          </select>
        </div>

        {/* Narration Speed */}
        <div>
          <span className="block text-[11px] font-medium text-zinc-400 mb-1">Speech Speed</span>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(e.target.value)}
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-editor-orange font-mono"
          >
            <option value="+0%">Normal (1.0x)</option>
            <option value="+10%">Energetic (1.1x)</option>
            <option value="+20%">Fast Dub (1.2x)</option>
            <option value="-10%">Deliberate (0.9x)</option>
          </select>
        </div>
      </div>

      {/* Subtitle Lip-Sync Delay Offset */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="block text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-editor-orange" />
            Subtitle Lip-Sync Offset
          </span>
          <span className="text-[10px] text-editor-orange font-mono">VAD Active</span>
        </div>
        <select
          value={audioDelay}
          onChange={(e) => setAudioDelay(Number(e.target.value))}
          className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-editor-orange font-mono"
        >
          <option value={250}>+250ms (Natural Lip-Sync & Subtitle Alignment)</option>
          <option value={350}>+350ms (Slightly relaxed delay)</option>
          <option value={150}>+150ms (Tighter timing)</option>
          <option value={0}>+0ms (Original raw timestamp)</option>
        </select>
      </div>

      {/* AI Drama Translation Engine (OpenRouter / Gemini) */}
      <div className="p-3 rounded-lg border border-editor-border bg-editor-input space-y-2">
        <div className="flex items-center justify-between">
          <span className="block text-[11px] font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-editor-orange" />
            AI Drama Translation Engine
          </span>
          <span className="text-[9px] text-editor-orange font-bold font-mono bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
            Active
          </span>
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AI API key (OpenRouter sk-or-... or Gemini...)"
            className="w-full bg-zinc-950 border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 pr-14 outline-none focus:border-editor-orange placeholder-zinc-600 transition-colors font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 border border-editor-border font-mono"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
          <span>
            Free key:{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-editor-orange hover:underline"
            >
              openrouter.ai
            </a>
          </span>
          <span className="text-editor-orange font-semibold text-[10px]">
            {geminiKey ? 'AI Engine Ready' : 'Free Google Fallback'}
          </span>
        </div>
      </div>

      {/* Audio-Video Remux Strategy */}
      <div>
        <span className="block text-[11px] font-medium text-zinc-400 mb-1.5">Audio Mixing Strategy</span>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 p-2 rounded-lg border border-editor-border bg-editor-input cursor-pointer hover:border-editor-borderHover">
            <input
              type="radio"
              name="remux-mode"
              value="duck"
              checked={remuxMode === 'duck'}
              onChange={() => setRemuxMode('duck')}
              className="accent-orange-500"
            />
            <div className="text-[11px]">
              <span className="font-bold text-white">Studio Audio Ducking (Music & SFX)</span>
              <p className="text-zinc-500 text-[10px]">Lowers original audio to 15% behind spoken Khmer (Best for Recap)</p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg border border-editor-border bg-editor-input cursor-pointer hover:border-editor-borderHover">
            <input
              type="radio"
              name="remux-mode"
              value="replace"
              checked={remuxMode === 'replace'}
              onChange={() => setRemuxMode('replace')}
              className="accent-orange-500"
            />
            <div className="text-[11px]">
              <span className="font-bold text-white">Full Audio Replacement</span>
              <p className="text-zinc-500 text-[10px]">Replaces entire audio track with clean Khmer voiceover</p>
            </div>
          </label>
        </div>
      </div>

      {/* Optional Network Proxy */}
      <div className="pt-2 border-t border-editor-border">
        <div className="flex items-center justify-between mb-1">
          <span className="block text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-editor-orange" />
            Network Proxy (Optional)
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">127.0.0.1:7890</span>
        </div>
        <input
          type="text"
          value={proxy}
          onChange={(e) => setProxy(e.target.value)}
          placeholder="e.g. 127.0.0.1:7890 (for Clash / VPN)"
          className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange placeholder-zinc-600 transition-colors font-mono"
        />
      </div>
    </div>
  );
}
