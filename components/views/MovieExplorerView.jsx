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
    <div className="flex-1 flex flex-col overflow-hidden bg-editor-black p-6 space-y-5">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 border-b border-editor-border">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-editor-orange" />
          Drama Explorer
        </h2>

        {results.length > 0 && (
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-editor-border px-2.5 py-0.5 rounded-lg">
            <span className="text-editor-orange font-bold">{results.length}</span> results
          </span>
        )}
      </div>

      {/* Search Input Box & Trending Chips */}
      <div className="bg-editor-panel border border-editor-border rounded-xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search by drama title, keywords, or actor name (e.g. 一代名剑, CEO romance, short drama)..."
              className="w-full bg-editor-input border border-editor-border focus:border-editor-orange text-xs text-white placeholder-zinc-500 rounded-lg pl-9 pr-4 py-2.5 outline-none font-mono"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-2.5 bg-editor-orange hover:bg-editor-orangeHover disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-orange-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>{loading ? 'Scraping...' : 'Search Movies'}</span>
          </button>
        </div>

        {/* Trending Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-zinc-500 font-mono text-[11px] mr-1">Trending:</span>
          {TRENDING_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuick(chip.query)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-editor-orange border border-editor-border transition-colors text-[11px] font-mono"
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
            <div className="w-9 h-9 rounded-full border-2 border-editor-orange border-t-transparent animate-spin" />
            <div className="text-xs font-mono text-zinc-300">
              Scraping video streams and metadata for <span className="text-editor-orange font-bold">"{query}"</span>...
            </div>
            <div className="text-[11px] text-zinc-500">Extracting stream IDs, titles, thumbnails, and durations</div>
          </div>
        ) : error ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-400 space-y-2 p-4">
            <AlertTriangle className="w-8 h-8 text-editor-orange stroke-[1.5]" />
            <div className="text-xs text-zinc-200 font-semibold">Search encountered an error</div>
            <div className="text-[11px] text-zinc-500 max-w-md font-mono">{error}</div>
          </div>
        ) : results.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
            <Film className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
            <div className="text-xs">No drama clips found. Try a different keyword or trending chip.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-editor-border bg-editor-panel hover:border-editor-orange/80 transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                {/* Thumbnail with overlay duration */}
                <div className="relative aspect-video w-full bg-zinc-900 rounded-lg overflow-hidden border border-editor-border">
                  <img
                    src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/320x180/18181b/ff6b00?text=Drama';
                    }}
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-white border border-white/10">
                    {item.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <h4
                    className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-editor-orange transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="truncate flex items-center gap-1">
                      <User className="w-3 h-3 text-editor-orange" />
                      {item.uploader}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-white transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-editor-border/60">
                  <button
                    onClick={() => onSelectMovieForDubbing(item)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-editor-orange hover:bg-editor-orangeHover text-black transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
                  >
                    <Play className="w-3 h-3 fill-black text-black" />
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
