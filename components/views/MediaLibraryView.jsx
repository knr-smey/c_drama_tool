'use client';

import React, { useState, useEffect } from 'react';
import { FolderArchive, Play, Folder, RefreshCw, Film, Copy, Check } from 'lucide-react';

export default function MediaLibraryView({
  onPlayVideoPath,
  onRevealPath,
  onOpenFolder
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState(null);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/list_library');
      const data = await res.json();
      setItems((data && data.items) || []);
    } catch (e) {
      console.warn('Failed to load media library:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleCopy = (path) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12] p-6 space-y-5 transition-colors duration-200">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebe7df] dark:border-[#242630]">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-dash-orange" />
          Media Library
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] px-2 py-0.5 rounded-full shadow-2xs">
            ./output
          </span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#15161e] hover:bg-zinc-50 dark:hover:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#242630] rounded-xl transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-dash-orange ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-dash-orange hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-500/25"
          >
            <Folder className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Open in Finder</span>
          </button>
        </div>
      </div>

      {/* Media Items Table / Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-dash-orange border-t-transparent animate-spin" />
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Loading exported projects...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center space-y-3 bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-8 shadow-sm transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-dash-orange">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No Dubbed Videos Yet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                Completed dubbed MP4 videos will automatically appear in this list.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((file, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[#ebe7df] dark:border-[#242630] bg-white dark:bg-[#15161e] hover:border-orange-300 dark:hover:border-dash-orange transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-dash-orange shrink-0">
                    <Film className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-dash-orange transition-colors">
                      {file.filename}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                      <span>Size: <strong className="text-zinc-700 dark:text-zinc-300">{file.size_mb} MB</strong></span>
                      <span>•</span>
                      <span>Exported: <strong className="text-zinc-700 dark:text-zinc-300">{file.created_at}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(file.path)}
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl bg-[#faf9f5] dark:bg-[#1a1c24] hover:bg-zinc-100 dark:hover:bg-[#252836] border border-[#e5e1d8] dark:border-[#2a2d39] transition-colors"
                    title="Copy File Path"
                  >
                    {copiedPath === file.path ? (
                      <Check className="w-3.5 h-3.5 text-dash-orange" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onRevealPath(file.path)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-[#faf9f5] dark:bg-[#1a1c24] hover:bg-zinc-100 dark:hover:bg-[#252836] border border-[#e5e1d8] dark:border-[#2a2d39] rounded-xl transition-colors"
                    title="Show in Finder"
                  >
                    <Folder className="w-3.5 h-3.5 text-dash-orange" />
                    <span>Reveal</span>
                  </button>

                  <button
                    onClick={() => onPlayVideoPath(file.path, file.download_url)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-dash-orange hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-500/25"
                    title="Play Video"
                  >
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
