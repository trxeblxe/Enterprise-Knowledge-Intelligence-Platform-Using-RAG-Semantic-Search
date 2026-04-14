import { useState, useRef } from 'react';
import { Search } from 'lucide-react';

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
          isFocused ? 'glow-red ring-1 ring-sony-red/30' : ''
        }`}>
          <div className="flex items-center px-5 py-4">
            <Search size={20} className="text-sony-gray mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g. Best Sony headphones for gym workouts under ₹10,000?"
              className="flex-1 bg-transparent text-sony-white text-base placeholder-sony-gray-dark outline-none"
              disabled={isLoading}
            />
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

          {/* Animated border sweep on focus */}
          {isFocused && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] animate-border-sweep" />
          )}
        </div>
      </div>
    </form>
  );
}
