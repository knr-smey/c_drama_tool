'use client';

import React, { useState } from 'react';
import { Settings, Sparkles, Sliders, Globe, Folder, ShieldCheck } from 'lucide-react';

export default function SettingsView({
  geminiKey,
  setGeminiKey,
  whisperModel,
  setWhisperModel,
  speechRate,
  setSpeechRate,
  audioDelay,
  setAudioDelay,
  voice,
  setVoice,
  vocalEnhancer,
  setVocalEnhancer,
  proxy,
  setProxy,
  onOpenFolder
}) {
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', geminiKey.trim());
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-editor-black p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-editor-border">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-editor-orange" />
            Studio Configuration & Parameters
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure AI drama translation keys, neural vocal realism, speech models, and network proxies.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-orange-500/10 text-editor-orange border border-editor-orange/30">
            <ShieldCheck className="w-4 h-4" />
            Settings Saved
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl space-y-5 pb-6">
        {/* 1. AI Drama Translation Engine */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-editor-orange" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                AI Drama Translation API Key
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-editor-orange bg-orange-500/10 border border-editor-orange/30 px-2 py-0.5 rounded">
              Movie Quality
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Supports free OpenRouter keys (<code className="text-editor-orange font-mono">sk-or-v1-...</code>) or Google Gemini AI Studio (<code className="text-editor-orange font-mono">AIzaSy...</code>).
          </p>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste AI key (OpenRouter sk-or-... or Gemini AIzaSy...)"
              className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 pr-16 outline-none focus:border-editor-orange font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-editor-border font-mono"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span>
              Get free OpenRouter key:{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-editor-orange hover:underline font-medium"
              >
                openrouter.ai/keys
              </a>
            </span>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-md text-xs font-bold bg-editor-orange hover:bg-editor-orangeHover text-black transition-all"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* 2. Default Voice & Vocal Realism */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-editor-orange" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Default Khmer Voice & Vocal Realism Engine
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1.5">Default Speaker</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="km-KH-PisethNeural">Piseth Neural (Male Narrator)</option>
                <option value="km-KH-SreymomNeural">Sreymom Neural (Female Voice)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1.5">Vocal Realism Profile</span>
              <select
                value={vocalEnhancer}
                onChange={(e) => setVocalEnhancer(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="studio_human">🎙️ Studio Human Voice (Chest Warmth + Natural Breathing)</option>
                <option value="dramatic_movie">🎬 Dramatic Movie Narrator (Deep Cinema Tone + Reverb)</option>
                <option value="warm_storyteller">📖 Warm Storyteller (Intimate & Smooth)</option>
                <option value="raw">🤖 Standard Synthetic Voice (Dry / Unprocessed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Audio & Speech Parameters */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-editor-orange" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Speech-to-Text & Lip-Sync Alignment
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1.5">Whisper Model</span>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="base">base (Fast CPU - int8)</option>
                <option value="small">small (Balanced - int8)</option>
                <option value="medium">medium (High Precision)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1.5">Speech Speed</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="+0%">Normal (1.0x)</option>
                <option value="+10%">Energetic (1.1x)</option>
                <option value="+20%">Fast Dub (1.2x)</option>
                <option value="-10%">Deliberate (0.9x)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1.5">Lip-Sync Timing Offset</span>
              <select
                value={audioDelay}
                onChange={(e) => setAudioDelay(Number(e.target.value))}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value={250}>+250ms (Natural Lip-Sync)</option>
                <option value={350}>+350ms (Relaxed)</option>
                <option value={150}>+150ms (Tight)</option>
                <option value={0}>+0ms (Raw Timestamp)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Network Proxy Configuration */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-editor-orange" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Network Proxy (Clash / v2ray / VPN)
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Auto-detects 127.0.0.1:7890</span>
          </div>

          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="e.g. 127.0.0.1:7890"
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-editor-orange placeholder-zinc-600 font-mono"
          />
        </div>

        {/* 5. Storage Directory */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-5 space-y-2 shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-editor-orange" />
              Export Output Directory
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">./output</p>
          </div>
          <button
            onClick={onOpenFolder}
            className="px-3.5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-editor-border rounded-lg transition-colors"
          >
            Open in Finder
          </button>
        </div>
      </div>
    </div>
  );
}
