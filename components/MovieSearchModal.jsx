'use client';

import React, { useState } from 'react';
import { Search, Sparkles, X, Film, AlertCircle, AlertTriangle, User, Check } from 'lucide-react';

const TRENDING = [
  { label: '⚔️ 一代名剑', query: '一代名剑' },
  { label: '🎬 Short Drama (短剧)', query: 'chinese drama short recap' },
  { label: '👑 CEO Romance', query: '霸道总裁 short drama' },
  { label: '🥋 Wuxia Martial Arts', query: 'wuxia martial arts drama' },
];

export default function MovieSearchModal({
  isOpen,
  onClose,
  onSelectMovie,
  proxy = ''
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search_movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8, proxy })
      });
      const data = await res.json();
      if (data && data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults((data && data.results) || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search online videos');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (kw) => {
    setQuery(kw);
    handleSearch(kw);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-editor-panel border border-editor-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-editor-border flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-editor-orange text-black flex items-center justify-center font-bold">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Search Online Dramas & Movies
                <span className="text-[10px] font-mono font-bold text-editor-orange bg-orange-500/10 border border-editor-orange/30 px-2 py-0.5 rounded">
                  Scraper AI
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Search thousands of Chinese dramas & videos across the web to dub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input & Chips */}
        <div className="p-4 border-b border-editor-border bg-editor-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search Chinese drama, short drama, title or keyword (e.g. 一代名剑, CEO romance)..."
                className="w-full bg-editor-black border border-editor-border focus:border-editor-orange text-xs text-white placeholder-zinc-500 rounded-lg pl-9 pr-4 py-2.5 outline-none font-mono"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-4 py-2.5 bg-editor-orange hover:bg-editor-orangeHover disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-zinc-500 font-mono text-[10px]">Trending:</span>
            {TRENDING.map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleQuick(t.query)}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-editor-orange border border-editor-border transition-colors font-mono"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
          {loading ? (
            <div className="h-52 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-editor-orange border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-zinc-300">
                Searching and scraping online dramas for <span className="text-editor-orange font-bold">"{query}"</span>...
              </div>
              <div className="text-[11px] text-zinc-500">Extracting stream metadata, titles & duration</div>
            </div>
          ) : error ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-400 space-y-2 p-4">
              <AlertTriangle className="w-8 h-8 text-editor-orange stroke-[1.5]" />
              <div className="text-xs text-zinc-200 font-semibold">Search encountered an error</div>
              <div className="text-[11px] text-zinc-500 max-w-md font-mono">{error}</div>
            </div>
          ) : results.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
              <Film className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
              <div className="text-xs">Enter keywords or click a trending drama chip to search online.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-editor-border bg-zinc-950/90 hover:border-editor-orange/80 transition-all flex flex-col justify-between space-y-2.5 group"
                >
                  <div className="flex gap-3">
                    <div className="relative w-32 h-20 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-editor-border">
                      <img
                        src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/320x180/18181b/ff6b00?text=Drama';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono font-bold text-white">
                        {item.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4
                          className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-editor-orange transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                        <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                          <User className="w-2.5 h-2.5 text-editor-orange" />
                          <span className="truncate">{item.uploader}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-editor-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">{item.id}</span>
                    <button
                      onClick={() => onSelectMovie(item)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-editor-orange hover:bg-editor-orangeHover text-black transition-all flex items-center gap-1 shadow-sm shadow-orange-500/20"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Use Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-editor-border bg-zinc-950/70 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>1-click loads video directly into KhmerDub pipeline</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-editor-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
