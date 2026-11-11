'use client';

import React from 'react';
import {
  Scissors,
  LayoutGrid,
  Search,
  FolderArchive,
  Settings,
  Folder,
  Power
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'editor',
  setActiveTab,
  systemStatus = 'Ready',
  onOpenOutputDir,
  onQuit
}) {
  const NAV_ITEMS = [
    { id: 'editor', label: 'Studio Editor', icon: LayoutGrid },
    { id: 'search', label: 'Search Dramas', icon: Search },
    { id: 'library', label: 'Media Library', icon: FolderArchive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-18 bg-[#fbfaf7] dark:bg-[#121319] border-r border-[#ebe7df] dark:border-[#22242c] flex flex-col justify-between items-center py-4 shrink-0 select-none z-30 transition-colors duration-200">
      {/* Top Branding Section */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* App Logo Mark */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-dash-orange to-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/30">
          <Scissors className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Navigation Menu (Icon-dock style) */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
                  isActive
                    ? 'bg-dash-orange text-white shadow-md shadow-orange-500/30 font-bold scale-105'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
                {isActive && (
                  <span className="absolute -left-2 w-1 h-5 bg-dash-orange rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="flex flex-col items-center gap-2.5 w-full px-2">
        <button
          onClick={onOpenOutputDir}
          className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          title="Open Output Folder"
        >
          <Folder className="w-4 h-4 text-dash-orange" />
        </button>

        <button
          onClick={onQuit}
          className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 dark:text-zinc-500 hover:text-dash-orange hover:bg-orange-500/10 transition-all"
          title="Quit Application"
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
