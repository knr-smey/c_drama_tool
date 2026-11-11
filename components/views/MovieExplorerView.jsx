'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Film, User, Check, Play, ExternalLink, AlertTriangle } from 'lucide-react';

const TRENDING_CHIPS = [
  { label: '⚔️ 一代名剑 (Master Sword)', query: '一代名剑' },
  { label: '🎬 Short Drama (短剧)', query: 'chinese drama short recap' },
  { label: '👑 CEO Romance (霸道总裁)', query: '霸道总裁 short drama' },
  { label: '🥋 Wuxia Martial Arts (武侠修仙)', query: 'wuxia martial arts drama' },
  { label: '⚡ Viral Revenge Drama (逆袭短剧)', query: '逆袭短剧 drama' },
];

export default function MovieExplorerView({
  onSelectMovieForDubbing,
  proxy = ''
}) {
  const [query, setQuery] = useState('一代名剑');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch on mount
    handleSearch('chinese drama short');
  }, []);

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search_movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 12, proxy })
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f5f0] dark:bg-[#0c0d12] p-6 space-y-5 transition-colors duration-200">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebe7df] dark:border-[#242630]">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-dash-orange" />
          Drama Explorer
        </h2>

        {results.length > 0 && (
          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] px-2.5 py-0.5 rounded-full shadow-2xs">
            Found <span className="text-dash-orange font-bold">{results.length}</span> results
          </span>
        )}
      </div>

      {/* Search Input Box & Trending Chips */}
      <div className="bg-white dark:bg-[#15161e] border border-[#ebe7df] dark:border-[#242630] rounded-2xl p-4 space-y-3 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search by drama title, keywords, or actor name..."
              className="w-full bg-[#faf9f5] dark:bg-[#1a1c24] border border-[#e5e1d8] dark:border-[#2a2d39] focus:border-dash-orange focus:bg-white dark:focus:bg-[#15161e] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl pl-9 pr-4 py-2.5 outline-none font-mono"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-2.5 bg-dash-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-orange-500/25"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        {/* Trending Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px] mr-1">Trending:</span>
          {TRENDING_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuick(chip.query)}
              className="px-3 py-1 rounded-xl bg-[#faf9f5] dark:bg-[#1a1c24] hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:border-orange-300 dark:hover:border-dash-orange text-zinc-700 dark:text-zinc-300 hover:text-dash-orange border border-[#e5e1d8] dark:border-[#2a2d39] transition-colors text-[11px] font-mono shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Workspace */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-9 h-9 rounded-full border-2 border-dash-orange border-t-transparent animate-spin" />
            <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
              Scraping video streams and metadata for <span className="text-dash-orange font-bold">"{query}"</span>...
            </div>
          </div>
        ) : error ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-500 dark:text-zinc-400 space-y-2 p-4">
            <AlertTriangle className="w-8 h-8 text-dash-orange stroke-[1.5]" />
            <div className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold">Search encountered an error</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md font-mono">{error}</div>
          </div>
        ) : results.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 space-y-2">
            <Film className="w-8 h-8 text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
            <div className="text-xs">No drama clips found. Try a different keyword or trending chip.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-[#ebe7df] dark:border-[#242630] bg-white dark:bg-[#15161e] hover:border-orange-300 dark:hover:border-dash-orange transition-all flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
              >
                {/* Thumbnail with overlay duration */}
                <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-[#ebe7df] dark:border-[#242630]">
                  <img
                    src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/320x180/f4f1ea/ff6b00?text=Drama';
                    }}
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-white backdrop-blur-xs">
                    {item.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <h4
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-dash-orange transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span className="truncate flex items-center gap-1">
                      <User className="w-3 h-3 text-dash-orange" />
                      {item.uploader}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-[#f0ece4] dark:border-[#242630]">
                  <button
                    onClick={() => onSelectMovieForDubbing(item)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-dash-orange hover:bg-orange-600 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
                  >
                    <Play className="w-3 h-3 fill-white text-white" />
                    <span>Dub Video</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
