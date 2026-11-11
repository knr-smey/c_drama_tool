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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-white border border-[#ebe7df] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d35] flex items-center justify-between bg-[#1e1f25]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-dash-orange text-white flex items-center justify-center font-bold">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Search Online Dramas & Movies
              </h3>
              <p className="text-[11px] text-zinc-400">Discover and import drama clips to dub with 1 click</p>
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
        <div className="p-4 border-b border-[#ebe7df] bg-[#faf9f5] space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search drama title or keywords..."
                className="w-full bg-white border border-[#e5e1d8] focus:border-dash-orange text-xs text-zinc-900 placeholder-zinc-400 rounded-xl pl-9 pr-4 py-2.5 outline-none font-mono"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-4 py-2.5 bg-dash-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm shadow-orange-500/25"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-zinc-400 font-mono text-[10px]">Trending:</span>
            {TRENDING.map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleQuick(t.query)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-orange-50 text-zinc-700 hover:text-dash-orange border border-[#e5e1d8] transition-colors font-mono text-[11px] shadow-2xs"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] bg-white">
          {loading ? (
            <div className="h-52 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-dash-orange border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-zinc-700">
                Searching online videos for <span className="text-dash-orange font-bold">"{query}"</span>...
              </div>
            </div>
          ) : error ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2 p-4">
              <AlertTriangle className="w-8 h-8 text-dash-orange stroke-[1.5]" />
              <div className="text-xs text-zinc-800 font-semibold">Search encountered an error</div>
              <div className="text-[11px] text-zinc-500 max-w-md font-mono">{error}</div>
            </div>
          ) : results.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-400 space-y-2">
              <Film className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
              <div className="text-xs">Enter keywords or click a trending drama chip to search.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-[#ebe7df] bg-white hover:border-orange-300 transition-all flex flex-col justify-between space-y-2.5 group shadow-xs hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <div className="relative w-32 h-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-[#ebe7df]">
                      <img
                        src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/320x180/f4f1ea/ff6b00?text=Drama';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                        {item.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4
                          className="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug group-hover:text-dash-orange transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                        <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                          <User className="w-2.5 h-2.5 text-dash-orange" />
                          <span className="truncate">{item.uploader}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f0ece4] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[150px]">{item.id}</span>
                    <button
                      onClick={() => onSelectMovie(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-dash-orange hover:bg-orange-600 text-white transition-all flex items-center gap-1 shadow-sm shadow-orange-500/20"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Use Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ebe7df] bg-[#faf9f5] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Click "Use Video" to load directly into the editor</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-[#e5e1d8] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
