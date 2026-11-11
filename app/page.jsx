'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MediaSource from '@/components/MediaSource';
import ProductionStyle from '@/components/ProductionStyle';
import VoiceSelection from '@/components/VoiceSelection';
import EngineParameters from '@/components/EngineParameters';
import TimelineTrack from '@/components/TimelineTrack';
import TerminalMonitor from '@/components/TerminalMonitor';
import SuccessBanner from '@/components/SuccessBanner';
import MovieSearchModal from '@/components/MovieSearchModal';
import { Play, XCircle } from 'lucide-react';

export default function Home() {
  // Parameters State
  const [url, setUrl] = useState('');
  const [productionMode, setProductionMode] = useState('recap');
  const [voice, setVoice] = useState('km-KH-PisethNeural');
  const [vocalEnhancer, setVocalEnhancer] = useState('studio_human');
  const [whisperModel, setWhisperModel] = useState('base');
  const [speechRate, setSpeechRate] = useState('+0%');
  const [audioDelay, setAudioDelay] = useState(250);
  const [geminiKey, setGeminiKey] = useState('');
  const [remuxMode, setRemuxMode] = useState('duck');
  const [proxy, setProxy] = useState('');
  const [selectedVideoMeta, setSelectedVideoMeta] = useState(null);

  // Runtime Pipeline State
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Ready');
  const [currentStage, setCurrentStage] = useState(0);
  const [stageBadge, setStageBadge] = useState('Idle');
  const [stageHeadline, setStageHeadline] = useState('Ready to initialize dubbing pipeline');
  const [progressPct, setProgressPct] = useState(0);
  const [completedData, setCompletedData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);

  // Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load saved AI Key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini_api_key');
      if (saved) setGeminiKey(saved);
    }
  }, []);

  // Save AI Key whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', geminiKey.trim());
    }
  }, [geminiKey]);

  // Connect to SSE event stream
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('onEngineUpdate', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.progress !== undefined) {
            setProgressPct(Math.min(100, Math.max(0, Math.round(data.progress))));
          }
          if (data.stage) {
            setCurrentStage(parseInt(data.stage, 10));
          }
          if (data.stage_name) {
            setStageBadge(`Stage ${data.stage || ''}: ${data.stage_name}`);
          }
          if (data.message) {
            setStageHeadline(data.message);
          }
          if (data.log) {
            appendLog(data.log.level || 'INFO', data.log.text || '', data.log.khmer || null);
          }
        } catch (err) {
          console.error('Error handling SSE onEngineUpdate:', err);
        }
      });

      eventSource.addEventListener('onJobComplete', (e) => {
        try {
          const data = JSON.parse(e.data);
          setProgressPct(100);
          setCurrentStage(6);
          setStageBadge('Completed');
          setStageHeadline('Khmer dubbed video exported successfully!');
          setIsRunning(false);
          setSystemStatus('Ready');

          const completed = {
            outputPath: data.output_path || '',
            downloadUrl: data.download_url || '',
            fileSize: data.file_size || 'N/A',
            duration: data.duration || 'N/A',
            time: new Date().toLocaleTimeString(),
          };
          setCompletedData(completed);
          appendLog('SUCCESS', `Dubbing complete! File saved at: ${completed.outputPath}`);
        } catch (err) {
          console.error('Error handling SSE onJobComplete:', err);
        }
      });

      eventSource.addEventListener('onJobError', (e) => {
        try {
          const data = JSON.parse(e.data);
          setIsRunning(false);
          setSystemStatus('Ready');
          setStageBadge('Failed');
          setStageHeadline(`Error at Stage ${data.stage || ''}: ${data.error || 'Failed'}`);
          appendLog('ERROR', `Pipeline error: ${data.error || 'Unknown error'}`);
        } catch (err) {
          console.error('Error handling SSE onJobError:', err);
        }
      });
    } catch (err) {
      console.warn('SSE connection unavailable:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const appendLog = (level, message, khmerText = null) => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { time, level, message, khmerText }]);
  };

  // Actions
  const handleStartPipeline = async () => {
    if (!url.trim()) {
      appendLog('ERROR', 'Please specify a target video URL or select a local video.');
      return;
    }

    const payload = {
      url: url.trim(),
      voice,
      whisper_model: whisperModel,
      speech_rate: speechRate,
      remux_mode: remuxMode,
      proxy: proxy.trim(),
      gemini_api_key: geminiKey.trim(),
      audio_delay_ms: audioDelay,
      production_mode: productionMode,
      vocal_enhancer: vocalEnhancer,
    };

    setIsRunning(true);
    setSystemStatus('Processing');
    setProgressPct(0);
    setCurrentStage(1);
    setStageBadge('Starting');
    setStageHeadline('Initializing dubbing pipeline...');
    setCompletedData(null);

    appendLog('INFO', `Starting pipeline for: ${payload.url}`);
    appendLog(
      'INFO',
      `Mode: ${productionMode.toUpperCase()} | Voice: ${voice} [${vocalEnhancer}] | Model: ${whisperModel}`
    );

    try {
      const res = await fetch('/api/start_pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.error) {
        appendLog('ERROR', data.error);
        setIsRunning(false);
        setSystemStatus('Ready');
      }
    } catch (err) {
      appendLog('ERROR', `API dispatch failed: ${err.message || err}`);
      setIsRunning(false);
      setSystemStatus('Ready');
    }
  };

  const handleCancelPipeline = async () => {
    try {
      appendLog('WARN', 'Cancellation requested by user...');
      await fetch('/api/cancel_pipeline', { method: 'POST' });
    } catch (err) {
      appendLog('ERROR', `Cancellation failed: ${err.message || err}`);
    }
  };

  const handleSelectLocalFile = async () => {
    // Check if Electron native file dialog is available
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.selectFile) {
      try {
        const filePath = await window.electronAPI.selectFile();
        if (filePath) {
          setUrl(filePath);
          setSelectedVideoMeta(null);
          appendLog('INFO', `Selected local file: ${filePath}`);
        }
      } catch (err) {
        appendLog('ERROR', `File dialog error: ${err.message || err}`);
      }
    } else {
      // Fallback file input
      const fileInput = document.getElementById('nextjs-file-input');
      if (fileInput) fileInput.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    appendLog('INFO', `Uploading file: ${file.name}...`);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data && data.path) {
        setUrl(data.path);
        setSelectedVideoMeta(null);
        appendLog('SUCCESS', `Uploaded to server: ${data.path}`);
      }
    } catch (err) {
      appendLog('ERROR', `Upload error: ${err.message || err}`);
    }
  };

  const handleOpenOutputDir = async () => {
    try {
      await fetch('/api/open_output_folder', { method: 'POST' });
      appendLog('INFO', 'Opened output directory.');
    } catch (err) {
      appendLog('INFO', 'Output folder path: ./output/');
    }
  };

  const handleQuit = async () => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.closeApp) {
      await window.electronAPI.closeApp();
    } else {
      try {
        await fetch('/api/close_app', { method: 'POST' });
      } catch (err) {}
      window.close();
    }
  };

  const handlePlayVideo = async () => {
    if (!completedData) return;
    if (completedData.downloadUrl) {
      window.open(completedData.downloadUrl, '_blank');
      return;
    }
    if (completedData.outputPath) {
      try {
        await fetch('/api/open_video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: completedData.outputPath }),
        });
      } catch (err) {
        appendLog('ERROR', `Playback error: ${err.message || err}`);
      }
    }
  };

  const handleRevealFile = async () => {
    if (!completedData || !completedData.outputPath) return;
    try {
      await fetch('/api/reveal_in_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: completedData.outputPath }),
      });
    } catch (err) {
      appendLog('ERROR', `Reveal file error: ${err.message || err}`);
    }
  };

  const handleSelectMovieFromSearch = (movie) => {
    setUrl(movie.url);
    setSelectedVideoMeta({
      title: movie.title,
      duration: movie.duration,
    });
    setIsSearchOpen(false);
    appendLog('SUCCESS', `Imported online video: "${movie.title}" [${movie.duration}]. Ready to dub!`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-black select-none font-sans text-white">
      {/* Top Application Bar */}
      <Header
        systemStatus={systemStatus}
        engineInfo="Whisper + Edge TTS (km-KH)"
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOutputDir={handleOpenOutputDir}
        onClearLogs={() => setLogs([])}
        onQuit={handleQuit}
      />

      {/* Main Two-Pane Split Dashboard */}
      <main className="flex-1 flex overflow-hidden bg-editor-black">
        {/* Left Inspector Panel (420px) */}
        <aside className="w-[420px] border-r border-editor-border bg-editor-panel flex flex-col justify-between shrink-0 overflow-y-auto p-5 space-y-4">
          <div className="space-y-4">
            {/* Project Settings Title */}
            <div className="pb-1 border-b border-editor-border/60 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-editor-orange rounded-sm" />
                Project Settings
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">Parameters</span>
            </div>

            {/* 1. Media Source Input */}
            <MediaSource
              url={url}
              setUrl={setUrl}
              selectedVideoMeta={selectedVideoMeta}
              onOpenSearch={() => setIsSearchOpen(true)}
              onSelectLocalFile={handleSelectLocalFile}
            />

            {/* 2. Production Style Selection */}
            <ProductionStyle mode={productionMode} setMode={setProductionMode} />

            {/* 3. Neural Voice & Vocal Realism */}
            <VoiceSelection
              voice={voice}
              setVoice={setVoice}
              vocalEnhancer={vocalEnhancer}
              setVocalEnhancer={setVocalEnhancer}
            />

            {/* 4. Engine Parameters */}
            <EngineParameters
              whisperModel={whisperModel}
              setWhisperModel={setWhisperModel}
              speechRate={speechRate}
              setSpeechRate={setSpeechRate}
              audioDelay={audioDelay}
              setAudioDelay={setAudioDelay}
              geminiKey={geminiKey}
              setGeminiKey={setGeminiKey}
              remuxMode={remuxMode}
              setRemuxMode={setRemuxMode}
              proxy={proxy}
              setProxy={setProxy}
            />
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-3 border-t border-editor-border space-y-2">
            <button
              onClick={handleStartPipeline}
              disabled={isRunning}
              className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-editor-orange hover:bg-editor-orangeHover active:scale-[0.99] shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <span className="inline-block animate-spin mr-1">⟳</span>
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>
                    {productionMode === 'recap'
                      ? 'Generate Drama Recap (សង្ខេបរឿង)'
                      : 'Start Dubbing Pipeline'}
                  </span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                onClick={handleCancelPipeline}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-editor-orange hover:text-white hover:bg-orange-500/10 border border-editor-orange/30 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Operation</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right Workspace: Timeline Track & Output Console */}
        <section className="flex-1 flex flex-col overflow-hidden bg-editor-black p-5 space-y-4">
          {/* Top: Timeline Track */}
          <TimelineTrack
            currentStage={currentStage}
            stageBadge={stageBadge}
            stageHeadline={stageHeadline}
            progressPct={progressPct}
          />

          {/* Success Notification Banner */}
          <SuccessBanner
            completedData={completedData}
            onPlayVideo={handlePlayVideo}
            onRevealFile={handleRevealFile}
          />

          {/* Bottom: Monitored Console Logs */}
          <TerminalMonitor
            logs={logs}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
            onCopyLogs={() => {
              const text = logs.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
              navigator.clipboard.writeText(text);
              appendLog('INFO', 'Logs copied to clipboard.');
            }}
          />
        </section>
      </main>

      {/* Online Drama Search Modal */}
      <MovieSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={handleSelectMovieFromSearch}
        proxy={proxy}
      />

      {/* Hidden file input for web fallback */}
      <input
        type="file"
        id="nextjs-file-input"
        accept="video/*,.mkv,.mov,.webm,.avi"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
