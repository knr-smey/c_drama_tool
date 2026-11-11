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
      return <span className="text-[11px] text-zinc-400 font-mono">Awaiting input</span>;
    }
    if (val.startsWith('http://') || val.startsWith('https://')) {
      return <span className="text-[11px] text-dash-orange font-mono font-bold">✓ Web URL</span>;
    }
    if (val.endsWith('.mp4') || val.endsWith('.mkv') || val.endsWith('.mov') || val.endsWith('.avi')) {
      return <span className="text-[11px] text-emerald-600 font-mono font-bold">✓ Local File</span>;
    }
    return <span className="text-[11px] text-zinc-500 font-mono">• Ready</span>;
  };

  return (
    <div className="bg-white border border-[#ebe7df] rounded-2xl p-4 space-y-3 shadow-sm">
      <label className="block text-xs font-bold text-zinc-900 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-dash-orange" />
          Media Source
        </span>
      </label>

      {/* Input container with Paste button */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Video URL or local file path..."
          className="w-full bg-[#faf9f5] border border-[#e5e1d8] focus:border-dash-orange focus:bg-white text-xs text-zinc-900 placeholder-zinc-400 rounded-xl pl-3 pr-16 py-2.5 outline-none transition-all font-mono"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            onClick={handlePaste}
            type="button"
            className="px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-white border border-[#e5e1d8] rounded-lg transition-all flex items-center gap-1 shadow-2xs"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3 h-3 text-dash-orange" />
            Paste
          </button>
        </div>
      </div>

      {/* Online Search & Local File actions */}
      <div className="flex items-center justify-between pt-1 border-t border-[#f0ece4]">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 text-xs font-bold text-dash-orange hover:text-orange-600 transition-colors py-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Find Drama Online
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectLocalFile}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors py-0.5"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse file
          </button>
          {getValidationBadge()}
        </div>
      </div>

      {/* Video preview meta badge when loaded */}
      {selectedVideoMeta && (
        <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Film className="w-4 h-4 text-dash-orange shrink-0" />
            <span className="truncate font-semibold text-zinc-900">{selectedVideoMeta.title}</span>
          </div>
          <span className="text-dash-orange shrink-0 font-mono text-[10px] ml-2 font-bold px-1.5 py-0.5 bg-white rounded border border-orange-200">
            {selectedVideoMeta.duration}
          </span>
        </div>
      )}
    </div>
  );
}
