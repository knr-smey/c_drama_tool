'use client';

import React from 'react';
import { Scissors, Folder, Trash2, Power, Search } from 'lucide-react';

export default function Header({
  systemStatus = 'Ready',
  engineInfo = 'Whisper + Edge TTS (km-KH)',
  onOpenSearch,
  onOpenOutputDir,
  onClearLogs,
  onQuit
}) {
  return (
    <header className="h-13 bg-editor-panel border-b border-editor-border px-5 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        {/* Minimalist Studio Orange Emblem */}
        <div className="w-8 h-8 rounded-lg bg-editor-orange flex items-center justify-center shadow-md shadow-orange-500/20 text-black">
          <Scissors className="w-4 h-4 text-black stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
              KhmerDub<span className="text-editor-orange font-extrabold">Studio</span>
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400 border border-editor-border rounded">
              Next.js
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-zinc-900 text-editor-orange border border-editor-orange/30 rounded">
              Desktop Pro
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-editor-border text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            systemStatus === 'Processing'
              ? 'bg-editor-orange animate-pulse shadow-sm shadow-orange-500/50'
              : 'bg-white shadow-sm shadow-white/50'
          }`}
        />
        <span className="text-zinc-200 font-medium">{systemStatus}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400 text-[11px] font-mono">{engineInfo}</span>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-editor-orange hover:bg-editor-orangeHover rounded-lg transition-all shadow-sm shadow-orange-500/20"
          title="Search Online Dramas & Movies"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Search Drama</span>
        </button>

        <button
          onClick={onOpenOutputDir}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-editor-border hover:border-editor-borderHover rounded-lg transition-all"
          title="Open Output Folder"
        >
          <Folder className="w-3.5 h-3.5 text-editor-orange" />
          <span>Output Folder</span>
        </button>

        <button
          onClick={onClearLogs}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all border border-transparent hover:border-editor-border"
          title="Clear Output Logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={onQuit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-editor-orange hover:text-white bg-orange-500/10 hover:bg-editor-orange border border-editor-orange/30 rounded-lg transition-all ml-1"
          title="Quit Application"
        >
          <Power className="w-3.5 h-3.5" />
          <span>Quit</span>
        </button>
      </div>
    </header>
  );
}
