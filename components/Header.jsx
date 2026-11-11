'use client';

import React from 'react';
import { Scissors, Folder, Trash2, Power, Search } from 'lucide-react';

export default function Header({
  systemStatus = 'Ready',
  engineInfo = 'Whisper + Edge TTS',
  onOpenSearch,
  onOpenOutputDir,
  onClearLogs,
  onQuit
}) {
  return (
    <header className="h-12 bg-[#1e1f25] border-b border-[#2a2c35] px-4 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left: Window Traffic Lights + Studio Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 pr-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
        </div>
        <div className="h-4 w-px bg-zinc-700/60" />
        <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
          KhmerDub<span className="text-dash-orange font-extrabold">Studio</span>
        </h1>
      </div>

      {/* Center: Search Pill (Matching the reference design) */}
      <button
        onClick={onOpenSearch}
        type="button"
        className="w-72 md:w-84 bg-[#2b2d35] hover:bg-[#353742] text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/5 transition-all text-xs"
      >
        <Search className="w-3.5 h-3.5 text-dash-orange" />
        <span className="text-zinc-400 font-normal">Search online dramas, movies, actors...</span>
      </button>

      {/* Right: Engine Status + Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2b2d35] border border-white/5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              systemStatus === 'Processing'
                ? 'bg-dash-orange animate-pulse shadow-sm shadow-orange-500/50'
                : 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
            }`}
          />
          <span className="text-zinc-200 font-medium">{systemStatus}</span>
        </div>

        <button
          onClick={onOpenOutputDir}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-[#2b2d35] hover:bg-[#353742] border border-white/5 rounded-full transition-all"
          title="Open Output Folder"
        >
          <Folder className="w-3.5 h-3.5 text-dash-orange" />
          <span>Output</span>
        </button>

        <button
          onClick={onClearLogs}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2b2d35] rounded-full transition-all"
          title="Clear Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onQuit}
          className="p-1.5 text-zinc-400 hover:text-dash-orange hover:bg-orange-500/10 rounded-full transition-all ml-0.5"
          title="Quit Application"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
