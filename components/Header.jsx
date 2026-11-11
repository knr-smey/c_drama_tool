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
    <header className="h-12 bg-editor-panel border-b border-editor-border px-4 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-2">
        <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
          KhmerDub<span className="text-editor-orange font-extrabold">Studio</span>
        </h1>
      </div>

      {/* Center Status Indicator */}
      <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-editor-border text-[11px]">
        <span
          className={`w-2 h-2 rounded-full ${
            systemStatus === 'Processing'
              ? 'bg-editor-orange animate-pulse shadow-sm shadow-orange-500/50'
              : 'bg-white shadow-sm shadow-white/50'
          }`}
        />
        <span className="text-zinc-200 font-medium">{systemStatus}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400 font-mono text-[10px]">{engineInfo}</span>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-black bg-editor-orange hover:bg-editor-orangeHover rounded-lg transition-all"
          title="Search Dramas"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Search</span>
        </button>

        <button
          onClick={onOpenOutputDir}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-editor-border rounded-lg transition-all"
          title="Open Output Folder"
        >
          <Folder className="w-3.5 h-3.5 text-editor-orange" />
          <span>Output</span>
        </button>

        <button
          onClick={onClearLogs}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          title="Clear Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onQuit}
          className="p-1.5 text-editor-orange hover:text-white bg-orange-500/10 hover:bg-editor-orange border border-editor-orange/30 rounded-lg transition-all ml-1"
          title="Quit"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
