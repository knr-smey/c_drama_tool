'use client';

import React from 'react';
import { Film, Clipboard, FolderOpen, Sparkles } from 'lucide-react';

export default function MediaSource({
  url,
  setUrl,
  selectedVideoMeta,
  onOpenSearch,
  onSelectLocalFile
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const getValidationBadge = () => {
    const val = (url || '').trim();
    if (!val) {
      return <span className="text-[11px] text-zinc-500 font-mono">Awaiting input</span>;
    }
    if (val.startsWith('http://') || val.startsWith('https://')) {
      return <span className="text-[11px] text-editor-orange font-mono font-medium">✓ Web URL</span>;
    }
    if (val.endsWith('.mp4') || val.endsWith('.mkv') || val.endsWith('.mov') || val.endsWith('.avi')) {
      return <span className="text-[11px] text-white font-mono font-medium">✓ Local Video</span>;
    }
    return <span className="text-[11px] text-zinc-400 font-mono">• Input Ready</span>;
  };

  return (
    <div className="bg-editor-card border border-editor-border rounded-xl p-3.5 space-y-2.5">
      <label className="block text-xs font-semibold text-white flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-editor-orange" />
          Media Source
        </span>
        <span className="text-[10px] text-zinc-500">YouTube or Local Video</span>
      </label>

      {/* Input container with Paste button */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste URL or drag & drop video file..."
          className="w-full bg-editor-input border border-editor-border focus:border-editor-orange text-xs text-white placeholder-zinc-600 rounded-lg pl-3 pr-16 py-2.5 outline-none transition-all font-mono"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            onClick={handlePaste}
            type="button"
            className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all flex items-center gap-1"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3 h-3" />
            Paste
          </button>
        </div>
      </div>

      {/* Online Search & Local File actions */}
      <div className="flex items-center justify-between pt-1 border-t border-editor-border/50">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 text-xs font-bold text-editor-orange hover:text-editor-orangeHover transition-colors py-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Find Drama Online
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectLocalFile}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors py-0.5"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse file
          </button>
          {getValidationBadge()}
        </div>
      </div>

      {/* Video preview meta badge when loaded */}
      {selectedVideoMeta && (
        <div className="p-2 rounded-lg bg-zinc-950 border border-editor-orange/30 text-[11px] text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Film className="w-3.5 h-3.5 text-editor-orange shrink-0" />
            <span className="truncate font-semibold text-white">{selectedVideoMeta.title}</span>
          </div>
          <span className="text-editor-orange shrink-0 font-mono text-[10px] ml-2 font-bold">
            {selectedVideoMeta.duration}
          </span>
        </div>
      )}
    </div>
  );
}
