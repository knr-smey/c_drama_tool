'use client';

import React from 'react';
import {
  Scissors,
  Film,
  Search,
  FolderArchive,
  Settings,
  Folder,
  Power,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'editor',
  setActiveTab,
  systemStatus = 'Ready',
  onOpenOutputDir,
  onQuit
}) {
  const NAV_ITEMS = [
    { id: 'editor', label: 'Editor', icon: Film },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: FolderArchive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-52 bg-editor-panel border-r border-editor-border flex flex-col justify-between shrink-0 select-none z-30">
      {/* Top Branding Section */}
      <div>
        <div className="h-14 border-b border-editor-border px-4 flex items-center gap-2.5 bg-zinc-950/40">
          <div className="w-7 h-7 rounded-lg bg-editor-orange text-black flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
            <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">
                KhmerDub<span className="text-editor-orange font-extrabold">Studio</span>
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">Pro Editor</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-2.5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-editor-orange text-black shadow-md shadow-orange-500/20 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80 border border-transparent hover:border-editor-border'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-black stroke-[2.5]' : 'text-editor-orange group-hover:scale-110 transition-transform'
                  }`}
                />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-editor-border bg-zinc-950/30 space-y-2">
        {/* Live Engine Status */}
        <div className="p-2 rounded-lg bg-zinc-900/80 border border-editor-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus === 'Processing'
                  ? 'bg-editor-orange animate-pulse shadow-sm shadow-orange-500/50'
                  : 'bg-white shadow-sm shadow-white/50'
              }`}
            />
            <span className="text-zinc-200 text-[11px] font-medium">{systemStatus}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Whisper+Edge</span>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenOutputDir}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-editor-border hover:border-editor-borderHover transition-all"
            title="Open Output Folder"
          >
            <Folder className="w-3.5 h-3.5 text-editor-orange" />
            <span>Output</span>
          </button>

          <button
            onClick={onQuit}
            className="flex items-center justify-center p-2 rounded-lg text-editor-orange hover:text-white bg-orange-500/10 hover:bg-editor-orange border border-editor-orange/30 transition-all"
            title="Quit Application"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
