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
    <div className="bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-4 space-y-3.5 shadow-sm transition-colors duration-200">
      <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
        <Sliders className="w-3.5 h-3.5 text-dash-orange" />
        Engine & Mixing
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Faster-Whisper Model */}
        <div>
          <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Whisper Model</span>
          <select
            value={whisperModel}
            onChange={(e) => setWhisperModel(e.target.value)}
            className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2d39] focus:border-dash-orange focus:bg-white dark:focus:bg-[#15161e] text-xs text-zinc-900 dark:text-zinc-100 rounded-xl px-2.5 py-2 outline-none font-mono"
          >
            <option value="base">base</option>
            <option value="small">small</option>
            <option value="medium">medium</option>
          </select>
        </div>

        {/* Narration Speed */}
        <div>
          <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Dub Speed</span>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(e.target.value)}
            className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2d39] focus:border-dash-orange focus:bg-white dark:focus:bg-[#15161e] text-xs text-zinc-900 dark:text-zinc-100 rounded-xl px-2.5 py-2 outline-none font-mono"
          >
            <option value="+0%">1.0x</option>
            <option value="+10%">1.1x</option>
            <option value="+20%">1.2x</option>
            <option value="-10%">0.9x</option>
          </select>
        </div>
      </div>

      {/* Subtitle Lip-Sync Delay Offset */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-dash-orange" />
            Audio Sync Offset
          </span>
        </div>
        <select
          value={audioDelay}
          onChange={(e) => setAudioDelay(Number(e.target.value))}
          className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2d39] focus:border-dash-orange focus:bg-white dark:focus:bg-[#15161e] text-xs text-zinc-900 dark:text-zinc-100 rounded-xl px-2.5 py-2 outline-none font-mono"
        >
          <option value={250}>+250ms (Default)</option>
          <option value={350}>+350ms</option>
          <option value={150}>+150ms</option>
          <option value={0}>0ms</option>
        </select>
      </div>

      {/* AI Drama Translation Engine (OpenRouter / Gemini) */}
      <div className="p-3 rounded-xl border border-[#e5e1d8] dark:border-[#2a2d39] bg-[#faf9f5] dark:bg-[#1a1c24] space-y-2">
        <div className="flex items-center justify-between">
          <span className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-dash-orange" />
            AI Drama Translation
          </span>
          {geminiKey ? (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              Cinema Quality
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-400 font-normal">
              Lexicon + Google
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Paste Gemini or OpenRouter API key"
            className="w-full bg-white dark:bg-[#121319] border border-[#e5e1d8] dark:border-[#2a2d39] text-xs text-zinc-900 dark:text-zinc-100 rounded-lg px-2.5 py-2 pr-14 outline-none focus:border-dash-orange placeholder-zinc-400 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#252836] border border-zinc-200 dark:border-[#323647] font-mono"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        {!geminiKey && (
          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
            <span>Get free cinema-grade AI key:</span>
            <div className="flex items-center gap-2 font-mono">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-dash-orange hover:underline font-bold"
              >
                Gemini Free
              </a>
              <span>•</span>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-dash-orange hover:underline font-bold"
              >
                OpenRouter
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Audio-Video Remux Strategy */}
      <div>
        <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Audio Mix</span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#e5e1d8] dark:border-[#2a2d39] bg-[#faf9f5] dark:bg-[#1a1c24] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500">
            <input
              type="radio"
              name="remux-mode"
              value="duck"
              checked={remuxMode === 'duck'}
              onChange={() => setRemuxMode('duck')}
              className="accent-orange-500"
            />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Audio Ducking</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#e5e1d8] dark:border-[#2a2d39] bg-[#faf9f5] dark:bg-[#1a1c24] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500">
            <input
              type="radio"
              name="remux-mode"
              value="replace"
              checked={remuxMode === 'replace'}
              onChange={() => setRemuxMode('replace')}
              className="accent-orange-500"
            />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Full Replace</span>
          </label>
        </div>
      </div>

      {/* Optional Network Proxy */}
      <div className="pt-2 border-t border-[#f0ece4] dark:border-[#242630]">
        <div className="flex items-center justify-between mb-1">
          <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-dash-orange" />
            Proxy (Optional)
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">127.0.0.1:7890</span>
        </div>
        <input
          type="text"
          value={proxy}
          onChange={(e) => setProxy(e.target.value)}
          placeholder="e.g. 127.0.0.1:7890"
          className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2d39] text-xs text-zinc-900 dark:text-zinc-100 rounded-xl px-2.5 py-2 outline-none focus:border-dash-orange placeholder-zinc-400 font-mono"
        />
      </div>
    </div>
  );
}
