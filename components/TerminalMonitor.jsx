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
        return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">OK</span>;
      case 'ERROR':
        return <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">ERR</span>;
      case 'WARN':
        return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">WRN</span>;
      case 'TRANSLATE':
        return <span className="bg-orange-100 dark:bg-orange-950/60 text-dash-orange font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">DUB</span>;
      case 'WHISPER':
        return <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">AI</span>;
      default:
        return <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono">INFO</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
      {/* Header Bar */}
      <div className="h-10 bg-[#faf9f5] dark:bg-[#121319] border-b border-[#ebe7df] dark:border-[#242630] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-dash-orange" />
            Activity Monitor
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
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
            className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 leading-relaxed bg-white dark:bg-[#0f1016] text-zinc-700 dark:text-zinc-300"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-400 dark:text-zinc-500 italic">
            [System initialized] KhmerDubStudio ready. Enter a video URL or search online to begin.
          </div>
        ) : (
          logs.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-5 font-mono">
              <div className="shrink-0 flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">[{item.time}]</span>
                {renderBadge(item.level)}
              </div>
              <div className="flex-1">
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.message}</span>
                {item.khmerText && (
                  <div className="mt-1 ml-2 text-zinc-900 dark:text-zinc-100 font-sans text-xs bg-orange-50/70 dark:bg-orange-950/30 px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/50">
                    ➔ Dub Script: {item.khmerText}
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
