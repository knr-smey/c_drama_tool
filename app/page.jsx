'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MediaSource from '@/components/MediaSource';
import VoiceSelection from '@/components/VoiceSelection';
import EngineParameters from '@/components/EngineParameters';
import TimelineTrack from '@/components/TimelineTrack';
import TerminalMonitor from '@/components/TerminalMonitor';
import SuccessBanner from '@/components/SuccessBanner';
import MovieSearchModal from '@/components/MovieSearchModal';

// Views
import MovieExplorerView from '@/components/views/MovieExplorerView';
import MediaLibraryView from '@/components/views/MediaLibraryView';
import SettingsView from '@/components/views/SettingsView';

import { Play, XCircle } from 'lucide-react';

export default function Home() {
  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState('light');

  // Navigation State
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'search' | 'library' | 'settings'

  // Parameters State
  const [url, setUrl] = useState('');
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

  // Quick Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('khmerdub_theme') || 'light';
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khmerdub_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

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

  // Pipeline Actions
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
      production_mode: 'direct',
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
      `Voice: ${voice} [${vocalEnhancer}] | Model: ${whisperModel}`
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

  const handlePlayVideoPath = async (filePath, downloadUrl) => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }
    if (filePath) {
      try {
        await fetch('/api/open_video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: filePath }),
        });
      } catch (err) {
        appendLog('ERROR', `Playback error: ${err.message || err}`);
      }
    }
  };

  const handleRevealPath = async (filePath) => {
    if (filePath) {
      try {
        await fetch('/api/reveal_in_folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: filePath }),
        });
      } catch (err) {
        appendLog('ERROR', `Reveal error: ${err.message || err}`);
      }
    }
  };

  // Called from MovieExplorerView
  const handleSelectMovieForDubbing = (movie) => {
    setUrl(movie.url);
    setSelectedVideoMeta({
      title: movie.title,
      duration: movie.duration,
    });
    setActiveTab('editor'); // Switch seamlessly to Editor workspace
    appendLog('SUCCESS', `Loaded "${movie.title}" [${movie.duration}] into Editor.`);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12] select-none font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* 1. Sidebar Navigation Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onOpenOutputDir={handleOpenOutputDir}
        onQuit={handleQuit}
      />

      {/* 2. Main Dynamic Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12]">
        {/* Top Header Bar */}
        <Header
          systemStatus={systemStatus}
          engineInfo="Whisper + Edge TTS (km-KH)"
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenOutputDir={handleOpenOutputDir}
          onClearLogs={() => setLogs([])}
          onQuit={handleQuit}
        />

        {/* View Switcher */}
        {activeTab === 'editor' && (
          <main className="flex-1 flex overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12]">
            {/* Left/Center Canvas: Greeting Stats + Timeline + Output Console */}
            <section className="flex-1 flex flex-col overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12] p-5 space-y-4">
              
              {/* Studio Overview Card (Matching reference top card with stats & wave) */}
              <div className="bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-5 shadow-sm flex items-center justify-between shrink-0 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-dash-orange" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-dash-orange font-mono">AI Dubbing Engine</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Studio Dashboard</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Automated speech extraction, translation, and neural voice remuxing.</p>
                </div>

                {/* Right Visual Stats & Wave */}
                <div className="flex items-center gap-6">
                  {/* Mini Stats Column */}
                  <div className="flex items-center gap-4 text-center">
                    <div className="bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#ebe7df] dark:border-[#2b2d38] px-3.5 py-2 rounded-xl">
                      <div className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono">
                        {systemStatus === 'Processing' ? '1' : '0'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">Active</div>
                    </div>
                    <div className="bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#ebe7df] dark:border-[#2b2d38] px-3.5 py-2 rounded-xl">
                      <div className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono">
                        {whisperModel}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">Whisper</div>
                    </div>
                  </div>

                  {/* Decorative Orange Waveform Graph (like reference image) */}
                  <div className="hidden lg:block w-44 h-12 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 160 50">
                      <path
                        d="M0,35 Q20,15 40,28 T80,10 T120,30 T160,18"
                        fill="none"
                        stroke="#ff6b00"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="120" cy="30" r="3.5" fill="#ff6b00" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Timeline Track Card */}
              <TimelineTrack
                currentStage={currentStage}
                stageBadge={stageBadge}
                stageHeadline={stageHeadline}
                progressPct={progressPct}
              />

              {/* Video Complete Banner */}
              <SuccessBanner
                completedData={completedData}
                onPlayVideo={() => handlePlayVideoPath(completedData?.outputPath, completedData?.downloadUrl)}
                onRevealFile={() => handleRevealPath(completedData?.outputPath)}
              />

              {/* Activity Log Monitor Card */}
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

            {/* Right Inspector Panel (400px) */}
            <aside className="w-[400px] border-l border-[#ebe7df] dark:border-[#242630] bg-[#fbfaf7] dark:bg-[#121319] flex flex-col justify-between shrink-0 overflow-y-auto p-5 space-y-4 transition-colors">
              <div className="space-y-4">
                <div className="pb-1 border-b border-[#ebe7df] dark:border-[#242630] flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-dash-orange rounded-sm" />
                    Dubbing Parameters
                  </h2>
                  <span className="text-[10px] text-zinc-400 font-mono">Inspector</span>
                </div>

                {/* Media Source Input */}
                <MediaSource
                  url={url}
                  setUrl={setUrl}
                  selectedVideoMeta={selectedVideoMeta}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onSelectLocalFile={handleSelectLocalFile}
                />

                {/* Neural Voice & Vocal Realism */}
                <VoiceSelection
                  voice={voice}
                  setVoice={setVoice}
                  vocalEnhancer={vocalEnhancer}
                  setVocalEnhancer={setVocalEnhancer}
                />

                {/* Engine Settings */}
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

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#ebe7df] dark:border-[#242630] space-y-2">
                <button
                  onClick={handleStartPipeline}
                  disabled={isRunning}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-dash-orange hover:bg-orange-600 active:scale-[0.99] shadow-md shadow-orange-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⟳</span>
                      <span>Processing Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Start Dubbing Pipeline</span>
                    </>
                  )}
                </button>

                {isRunning && (
                  <button
                    onClick={handleCancelPipeline}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-dash-orange hover:bg-orange-100/60 dark:hover:bg-orange-500/20 border border-orange-300 dark:border-orange-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Operation</span>
                  </button>
                )}
              </div>
            </aside>
          </main>
        )}

        {activeTab === 'search' && (
          <MovieExplorerView
            onSelectMovieForDubbing={handleSelectMovieForDubbing}
            proxy={proxy}
          />
        )}

        {activeTab === 'library' && (
          <MediaLibraryView
            onPlayVideoPath={handlePlayVideoPath}
            onRevealPath={handleRevealPath}
            onOpenFolder={handleOpenOutputDir}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            geminiKey={geminiKey}
            setGeminiKey={setGeminiKey}
            whisperModel={whisperModel}
            setWhisperModel={setWhisperModel}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            audioDelay={audioDelay}
            setAudioDelay={setAudioDelay}
            voice={voice}
            setVoice={setVoice}
            vocalEnhancer={vocalEnhancer}
            setVocalEnhancer={setVocalEnhancer}
            proxy={proxy}
            setProxy={setProxy}
            onOpenFolder={handleOpenOutputDir}
          />
        )}
      </div>

      {/* Quick Search Modal */}
      <MovieSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={(movie) => handleSelectMovieForDubbing(movie, productionMode)}
        proxy={proxy}
      />

      {/* Hidden file input for file upload fallback */}
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
