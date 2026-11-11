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
      <div className="flex items-center justify-between pb-3 border-b border-editor-border">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-editor-orange" />
          Settings
        </h2>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-orange-500/10 text-editor-orange border border-editor-orange/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl space-y-4 pb-6">
        {/* 1. AI Drama Translation Engine */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-editor-orange" />
              API Key
            </h3>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="OpenRouter or Gemini API Key"
              className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-3 py-2 pr-16 outline-none focus:border-editor-orange font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-editor-border font-mono"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-md text-xs font-bold bg-editor-orange hover:bg-editor-orangeHover text-black transition-all"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* 2. Default Voice & Vocal Realism */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-editor-orange" />
            Audio Profile
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1">Speaker</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="km-KH-PisethNeural">Piseth (Male)</option>
                <option value="km-KH-SreymomNeural">Sreymom (Female)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1">Enhancer</span>
              <select
                value={vocalEnhancer}
                onChange={(e) => setVocalEnhancer(e.target.value)}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
              >
                <option value="studio_human">Studio Human</option>
                <option value="dramatic_movie">Cinema Narrator</option>
                <option value="warm_storyteller">Storyteller</option>
                <option value="raw">Raw</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Audio & Speech Parameters */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-editor-orange" />
            Engine Parameters
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1">Whisper</span>
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

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1">Speed</span>
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

            <div>
              <span className="block text-xs font-medium text-zinc-300 mb-1">Sync Offset</span>
              <select
                value={audioDelay}
                onChange={(e) => setAudioDelay(Number(e.target.value))}
                className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
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
        <div className="bg-editor-panel border border-editor-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-editor-orange" />
            Proxy
          </h3>
          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="127.0.0.1:7890 (optional)"
            className="w-full bg-editor-input border border-editor-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-editor-orange font-mono"
          />
        </div>

        {/* 5. Storage Directory */}
        <div className="bg-editor-panel border border-editor-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-editor-orange" />
              Output Directory
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">./output</p>
          </div>
          <button
            onClick={onOpenFolder}
            className="px-3 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-editor-border rounded-lg transition-colors"
          >
            Open in Finder
          </button>
        </div>
      </div>
    </div>
  );
}
