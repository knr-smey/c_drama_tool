'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, Copy } from 'lucide-react';

export default function TerminalMonitor({
  logs = [],
  autoScroll = true,
  setAutoScroll,
  onCopyLogs
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const renderBadge = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'SUCCESS':
        return <span className="text-editor-orange font-bold font-mono">[SUCCESS]</span>;
      case 'ERROR':
        return <span className="bg-editor-orange text-black font-extrabold px-1 rounded font-mono">[ERROR]</span>;
      case 'WARN':
        return <span className="text-orange-300 font-bold font-mono">[WARN]</span>;
      case 'TRANSLATE':
        return <span className="text-editor-orange font-bold font-mono">[TRANSLATE]</span>;
      case 'WHISPER':
        return <span className="text-zinc-300 font-bold font-mono">[SPEECH]</span>;
      default:
        return <span className="text-zinc-400 font-bold font-mono">[INFO]</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-editor-black border border-editor-border rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="h-9 bg-editor-panel border-b border-editor-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-editor-orange" />
          </div>
          <span className="text-[11px] font-mono text-zinc-300 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-editor-orange" />
            Output Monitor
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-orange-500"
            />
            Auto-scroll
          </label>
          <button
            onClick={onCopyLogs}
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy Logs
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 leading-relaxed bg-editor-black text-zinc-300"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-500 italic">
            [System initialized] KhmerDubStudio ready. Enter a video URL or search online to begin.
          </div>
        ) : (
          logs.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-5 font-mono">
              <div className="shrink-0">
                <span className="text-zinc-600">[{item.time}]</span> {renderBadge(item.level)}
              </div>
              <div className="flex-1">
                <span className="text-zinc-200">{item.message}</span>
                {item.khmerText && (
                  <div className="mt-1 ml-3 text-white font-sans text-xs bg-editor-card px-2.5 py-1.5 rounded border border-editor-orange/40">
                    ➔ ភាសាខ្មែរ: {item.khmerText}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
