'use client';

import React from 'react';
import { Scissors, Folder, Trash2, Power, Search, Sun, Moon } from 'lucide-react';

export default function Header({
  systemStatus = 'Ready',
  engineInfo = 'Whisper + Edge TTS',
  theme = 'light',
  onToggleTheme,
  onOpenSearch,
  onOpenOutputDir,
  onClearLogs,
  onQuit
}) {
  return (
    <header className="h-12 bg-white dark:bg-[#121319] border-b border-[#ebe7df] dark:border-[#22242c] px-4 flex items-center justify-between shrink-0 z-20 select-none transition-colors duration-200">
      {/* Left: Window Traffic Lights + Studio Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 pr-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
        </div>
        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700/60" />
        <h1 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
          KhmerDub<span className="text-dash-orange font-extrabold">Studio</span>
        </h1>
      </div>

      {/* Center: Search Pill (Matching the reference design) */}
      <button
        onClick={onOpenSearch}
        type="button"
        className="w-72 md:w-84 bg-[#f4f1ea] hover:bg-[#eae6dc] dark:bg-[#1c1e27] dark:hover:bg-[#252834] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-[#e5e1d8] dark:border-white/5 transition-all text-xs"
      >
        <Search className="w-3.5 h-3.5 text-dash-orange" />
        <span className="text-zinc-500 dark:text-zinc-400 font-normal">Search online dramas, movies, actors...</span>
      </button>

      {/* Right: Engine Status + Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f1ea] dark:bg-[#1c1e27] border border-[#e5e1d8] dark:border-white/5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              systemStatus === 'Processing'
                ? 'bg-dash-orange animate-pulse shadow-sm shadow-orange-500/50'
                : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            }`}
          />
          <span className="text-zinc-700 dark:text-zinc-200 font-medium">{systemStatus}</span>
        </div>

        <button
          onClick={onOpenOutputDir}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white bg-[#f4f1ea] hover:bg-[#eae6dc] dark:bg-[#1c1e27] dark:hover:bg-[#252834] border border-[#e5e1d8] dark:border-white/5 rounded-full transition-all"
          title="Open Output Folder"
        >
          <Folder className="w-3.5 h-3.5 text-dash-orange" />
          <span>Output</span>
        </button>

        <button
          onClick={onClearLogs}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1c1e27] rounded-full transition-all"
          title="Clear Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1c1e27] rounded-full transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-dash-orange" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </button>

        <button
          onClick={onQuit}
          className="p-1.5 text-zinc-500 hover:text-dash-orange dark:text-zinc-400 dark:hover:text-dash-orange hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-full transition-all ml-0.5"
          title="Quit Application"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
