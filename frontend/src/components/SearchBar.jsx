import { useState, useRef } from 'react';
import { Search, CornerDownLeft, Wand2 } from 'lucide-react';

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto" id="search-form">
      <div className="relative group">
        {/* Main input container */}
        <div className={`relative glass rounded-2xl overflow-hidden transition-all duration-300 ${
          isFocused ? 'glow-red ring-1 ring-sony-red/35' : ''
        }`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sony-red/70 to-transparent" />
          <div className="flex items-center px-5 py-4">
            <Search size={20} className={`mr-3 flex-shrink-0 transition-colors ${isFocused ? 'text-sony-red' : 'text-sony-gray'}`} />
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask anything... e.g. Compare WH-1000XM5 vs WH-CH720N for calls"
              className="flex-1 bg-transparent text-sony-white text-base placeholder-sony-gray-dark outline-none"
              disabled={isLoading}
            />

            {!query.trim() && (
              <div className="hidden md:flex items-center gap-1 text-[11px] text-sony-gray border border-sony-surface-light rounded-md px-2 py-1 mr-2">
                <Wand2 size={12} />
                AI Search
              </div>
            )}

            <button
              id="search-button"
              type="submit"
              disabled={!query.trim() || isLoading}
              className="ml-3 px-6 py-2 bg-sony-red text-white text-sm font-semibold rounded-xl
                         transition-all duration-300 hover:bg-sony-red-dark hover:glow-red-strong
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                         flex-shrink-0"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching
                </span>
              ) : 'Search'}
            </button>
          </div>

          <div className="px-5 pb-3 flex items-center justify-between">
            <p className="text-[11px] text-sony-gray">
              Supports product comparisons, recommendations, and specification lookups.
            </p>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-sony-gray">
              <CornerDownLeft size={12} />
              Press Enter to run query
            </div>
          </div>

          {/* Animated border sweep on focus */}
          {isFocused && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] animate-border-sweep" />
          )}
        </div>
      </div>
    </form>
  );
}
