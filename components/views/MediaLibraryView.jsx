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
    <div className="flex-1 flex flex-col overflow-hidden bg-editor-black p-6 space-y-5">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 border-b border-editor-border">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-editor-orange" />
          Library
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-editor-border px-2 py-0.5 rounded">
            ./output
          </span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-editor-border rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-editor-orange ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-editor-orange hover:bg-editor-orangeHover rounded-lg transition-all shadow-sm shadow-orange-500/20"
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
            <div className="w-8 h-8 rounded-full border-2 border-editor-orange border-t-transparent animate-spin" />
            <div className="text-xs text-zinc-400 font-mono">Loading exported projects...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center space-y-3 bg-editor-panel border border-editor-border rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-editor-border flex items-center justify-center text-zinc-500">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Dubbed Videos Yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                When you run the dubbing or drama recap pipeline, completed MP4 videos will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((file, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-editor-border bg-editor-panel hover:border-editor-orange/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-editor-border flex items-center justify-center text-editor-orange shrink-0">
                    <Film className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="text-xs font-bold text-white truncate group-hover:text-editor-orange transition-colors">
                      {file.filename}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 font-mono">
                      <span>Size: <strong className="text-zinc-300">{file.size_mb} MB</strong></span>
                      <span>•</span>
                      <span>Exported: <strong className="text-zinc-300">{file.created_at}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(file.path)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-editor-border transition-colors"
                    title="Copy File Path"
                  >
                    {copiedPath === file.path ? (
                      <Check className="w-3.5 h-3.5 text-editor-orange" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onRevealPath(file.path)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-editor-border rounded-lg transition-colors"
                    title="Show in Finder"
                  >
                    <Folder className="w-3.5 h-3.5 text-editor-orange" />
                    <span>Reveal</span>
                  </button>

                  <button
                    onClick={() => onPlayVideoPath(file.path, file.download_url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-editor-orange hover:bg-editor-orangeHover rounded-lg transition-all shadow-sm shadow-orange-500/20"
                    title="Play Video"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
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
