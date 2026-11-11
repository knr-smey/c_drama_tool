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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f5f0] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebe7df]">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-dash-orange" />
          Settings & Preferences
        </h2>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl space-y-4 pb-6">
        {/* 1. AI Drama Translation Engine */}
        <div className="bg-white border border-[#ebe7df] rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-dash-orange" />
              API Key (OpenRouter or Gemini)
            </h3>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste OpenRouter (sk-or-...) or Gemini API key"
              className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2.5 pr-16 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 hover:text-zinc-900 px-2.5 py-1 rounded-lg bg-white border border-[#e5e1d8] font-mono shadow-2xs"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-dash-orange hover:bg-orange-600 text-white shadow-sm shadow-orange-500/20 transition-all"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* 2. Default Voice & Vocal Realism */}
        <div className="bg-white border border-[#ebe7df] rounded-2xl p-5 space-y-3.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-dash-orange" />
            Voice & Audio Profile
          </h3>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Default Speaker</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value="km-KH-PisethNeural">Piseth (Male Narrator)</option>
                <option value="km-KH-SreymomNeural">Sreymom (Female Dialogue)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Vocal Realism Engine</span>
              <select
                value={vocalEnhancer}
                onChange={(e) => setVocalEnhancer(e.target.value)}
                className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value="studio_human">Studio Human (Warm + Breathing)</option>
                <option value="dramatic_movie">Cinema Narrator (Deep Tone)</option>
                <option value="warm_storyteller">Storyteller (Smooth)</option>
                <option value="raw">Raw Voice</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Audio & Speech Parameters */}
        <div className="bg-white border border-[#ebe7df] rounded-2xl p-5 space-y-3.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-dash-orange" />
            Speech Engine Parameters
          </h3>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Whisper Model</span>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value="base">base</option>
                <option value="small">small</option>
                <option value="medium">medium</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Dub Speed</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value="+0%">1.0x</option>
                <option value="+10%">1.1x</option>
                <option value="+20%">1.2x</option>
                <option value="-10%">0.9x</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Lip-Sync Offset</span>
              <select
                value={audioDelay}
                onChange={(e) => setAudioDelay(Number(e.target.value))}
                className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value={250}>+250ms</option>
                <option value={350}>+350ms</option>
                <option value={150}>+150ms</option>
                <option value={0}>0ms</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Network Proxy Configuration */}
        <div className="bg-white border border-[#ebe7df] rounded-2xl p-5 space-y-2.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-dash-orange" />
            Network Proxy
          </h3>
          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="127.0.0.1:7890 (optional for VPN/proxy)"
            className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 rounded-xl px-3 py-2 outline-none font-mono"
          />
        </div>

        {/* 5. Storage Directory */}
        <div className="bg-white border border-[#ebe7df] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-dash-orange" />
              Output Directory
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">./output</p>
          </div>
          <button
            onClick={onOpenFolder}
            className="px-4 py-2 text-xs font-bold bg-[#faf9f5] hover:bg-zinc-100 text-zinc-800 border border-[#e5e1d8] rounded-xl transition-colors shadow-2xs"
          >
            Open in Finder
          </button>
        </div>
      </div>
    </div>
  );
}
