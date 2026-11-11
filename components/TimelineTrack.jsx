'use client';

import React from 'react';
import { CircleDashed, Check, AlertTriangle } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'Ingestion', sub: 'yt-dlp stream' },
  { id: 2, name: 'Extraction', sub: '16kHz WAV' },
  { id: 3, name: 'Transcribe', sub: 'faster-whisper' },
  { id: 4, name: 'Translate', sub: 'Khmer (km)' },
  { id: 5, name: 'Voiceover', sub: 'edge-tts Khmer' },
  { id: 6, name: 'Remux', sub: 'ffmpeg render' },
];

export default function TimelineTrack({
  currentStage = 0,
  stageBadge = 'Idle',
  stageHeadline = 'Ready to initialize dubbing pipeline',
  progressPct = 0
}) {
  const getStepStatus = (stepId) => {
    if (currentStage > stepId || progressPct === 100) return 'completed';
    if (currentStage === stepId) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-dash-orange" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Pipeline Timeline</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-950/40 text-dash-orange border border-orange-200 dark:border-orange-900/50">
            {stageBadge}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-xs truncate max-w-[420px]">{stageHeadline}</span>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tracking-tight text-dash-orange font-mono">
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>

      {/* Main Clean Orange Progress Bar */}
      <div className="w-full h-2.5 bg-[#f4f1ea] dark:bg-[#1f212b] rounded-full overflow-hidden p-0.5 border border-[#e5e1d8] dark:border-[#2a2d39]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-dash-orange to-orange-500 transition-all duration-300 ease-out shadow-sm shadow-orange-500/20"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>

      {/* 6 Step Cards */}
      <div className="grid grid-cols-6 gap-2.5 pt-0.5">
        {STAGES.map((s) => {
          const status = getStepStatus(s.id);

          let cardClass =
            'step-card p-3 rounded-xl border border-[#e5e1d8] dark:border-[#242630] bg-[#faf9f5] dark:bg-[#1a1c24] transition-all duration-200';
          let numClass = 'text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 step-num';
          let titleClass = 'text-xs font-bold text-zinc-700 dark:text-zinc-300';
          let subClass = 'text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate';
          let icon = <CircleDashed className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />;

          if (status === 'active') {
            cardClass =
              'step-card p-3 rounded-xl border-2 border-dash-orange bg-orange-50/70 dark:bg-orange-950/30 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/20 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-dash-orange step-num';
            titleClass = 'text-xs font-extrabold text-zinc-900 dark:text-white';
            subClass = 'text-[10px] text-dash-orange font-mono truncate font-semibold';
            icon = <span className="inline-block w-2 h-2 rounded-full bg-dash-orange animate-ping" />;
          } else if (status === 'completed') {
            cardClass =
              'step-card p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 step-num';
            titleClass = 'text-xs font-bold text-zinc-900 dark:text-zinc-100';
            subClass = 'text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate';
            icon = <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />;
          } else if (status === 'error') {
            cardClass =
              'step-card p-3 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-red-500 dark:text-red-400 step-num';
            titleClass = 'text-xs font-bold text-red-900 dark:text-red-200';
            subClass = 'text-[10px] text-red-400 dark:text-red-400 font-mono truncate';
            icon = <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />;
          }

          return (
            <div key={s.id} className={cardClass}>
              <div className="flex items-center justify-between mb-1">
                <span className={numClass}>0{s.id}</span>
                <span className="step-status">{icon}</span>
              </div>
              <div className={titleClass}>{s.name}</div>
              <div className={subClass}>{s.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
