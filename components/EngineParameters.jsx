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
          <span className="block text-[11px] font-medium text-zinc-400 mb-1">Whisper</span>
          <select
            value={whisperModel}
            onChange={(e) => setWhisperModel(e.target.value)}
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
          >
            <option value="base">base</option>
            <option value="small">small</option>
            <option value="medium">medium</option>
          </select>
        </div>

        {/* Narration Speed */}
        <div>
          <span className="block text-[11px] font-medium text-zinc-400 mb-1">Speed</span>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(e.target.value)}
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
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
          <span className="block text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-editor-orange" />
            Audio Sync Offset
          </span>
        </div>
        <select
          value={audioDelay}
          onChange={(e) => setAudioDelay(Number(e.target.value))}
          className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
        >
          <option value={250}>+250ms (Default)</option>
          <option value={350}>+350ms</option>
          <option value={150}>+150ms</option>
          <option value={0}>0ms</option>
        </select>
      </div>

      {/* AI Drama Translation Engine (OpenRouter / Gemini) */}
      <div className="p-2.5 rounded-lg border border-editor-border bg-editor-input space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="block text-[11px] font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-editor-orange" />
            API Key
          </span>
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="OpenRouter or Gemini API key"
            className="w-full bg-zinc-950 border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 pr-14 outline-none focus:border-editor-orange placeholder-zinc-600 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 border border-editor-border font-mono"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Audio-Video Remux Strategy */}
      <div>
        <span className="block text-[11px] font-medium text-zinc-400 mb-1">Audio Mix</span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2 rounded-lg border border-editor-border bg-editor-input cursor-pointer hover:border-editor-borderHover">
            <input
              type="radio"
              name="remux-mode"
              value="duck"
              checked={remuxMode === 'duck'}
              onChange={() => setRemuxMode('duck')}
              className="accent-orange-500"
            />
            <span className="text-xs font-semibold text-white">Audio Ducking</span>
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
            <span className="text-xs font-semibold text-white">Full Replace</span>
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
