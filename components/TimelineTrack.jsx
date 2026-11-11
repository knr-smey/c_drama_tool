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
    <div className="bg-editor-panel border border-editor-border rounded-xl p-4 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-editor-orange" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Pipeline Timeline</span>
          <span className="text-zinc-600">•</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-editor-border">
            {stageBadge}
          </span>
          <span className="text-zinc-400 text-xs truncate max-w-[420px]">{stageHeadline}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black tracking-tight text-editor-orange font-mono">
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>

      {/* Main Clean Orange Progress Bar */}
      <div className="w-full h-2.5 bg-editor-black rounded-full overflow-hidden p-0.5 border border-editor-border">
        <div
          className="h-full rounded-full bg-editor-orange transition-all duration-300 ease-out shadow-md shadow-orange-500/30"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>

      {/* 6 Step Cards */}
      <div className="grid grid-cols-6 gap-2 pt-0.5">
        {STAGES.map((s) => {
          const status = getStepStatus(s.id);

          let cardClass =
            'step-card p-2.5 rounded-lg border border-editor-border bg-editor-card transition-all duration-200';
          let numClass = 'text-[10px] font-mono font-bold text-zinc-500 step-num';
          let icon = <CircleDashed className="w-3 h-3 text-zinc-600" />;

          if (status === 'active') {
            cardClass =
              'step-card p-2.5 rounded-lg border-2 border-editor-orange bg-editor-orangeDim shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-editor-orange step-num';
            icon = <span className="inline-block w-2 h-2 rounded-full bg-editor-orange animate-ping" />;
          } else if (status === 'completed') {
            cardClass =
              'step-card p-2.5 rounded-lg border border-zinc-700 bg-zinc-900 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-white step-num';
            icon = <Check className="w-3 h-3 text-editor-orange stroke-[3]" />;
          } else if (status === 'error') {
            cardClass =
              'step-card p-2.5 rounded-lg border border-red-600 bg-red-950/20 transition-all duration-200';
            numClass = 'text-[10px] font-mono font-bold text-red-400 step-num';
            icon = <AlertTriangle className="w-3 h-3 text-red-400" />;
          }

          return (
            <div key={s.id} className={cardClass}>
              <div className="flex items-center justify-between mb-1">
                <span className={numClass}>0{s.id}</span>
                <span className="step-status">{icon}</span>
              </div>
              <div className="text-xs font-bold text-white">{s.name}</div>
              <div className="text-[10px] text-zinc-500 font-mono truncate">{s.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
