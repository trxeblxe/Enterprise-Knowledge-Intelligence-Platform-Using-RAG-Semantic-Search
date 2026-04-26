import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ParticleBackground from './components/ParticleBackground';
import LoadingSkeleton from './components/LoadingSkeleton';
import ResultsPanel from './components/ResultsPanel';
import ConversationHistory from './components/ConversationHistory';
import Footer from './components/Footer';
import { submitQuery } from './api/client';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSearch = useCallback(async (query) => {
    if (!query || !query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null); // clear previous result while loading

    try {
      const data = await submitQuery(query.trim());
      setResult(data);
      setHistory((prev) => [...prev, {
        question: data.question || query,
        answer: data.answer,
        sources: data.sources,
        processingTime: data.processingTime,
      }]);
    } catch (err) {
      // err.message is already formatted by the axios interceptor
      const message =
        err.message ||
        err.response?.data?.detail ||
        'Something went wrong. Please try again.';
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewSearch = () => {
    setResult(null);
    setError(null);
    setHistory([]);
  };

  const hasResults = !!(result || isLoading);

  return (
    <div className="relative min-h-screen bg-sony-black">
      <ParticleBackground />
      <Navbar />

      <main>
        <HeroSection
          onSearch={handleSearch}
          isLoading={isLoading}
          hasResults={hasResults}
        />

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto px-6 py-8"
            >
              <div className="glass rounded-2xl p-6 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sony-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sony-red text-lg font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sony-white font-semibold mb-1">Search Failed</h3>
                    <p className="text-sm text-sony-gray leading-relaxed">{error}</p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setError(null)}
                        className="text-xs px-4 py-1.5 rounded-lg bg-sony-red/20 text-sony-red
                                   hover:bg-sony-red hover:text-white transition-all duration-300 cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => { setError(null); setResult(null); }}
                        className="text-xs px-4 py-1.5 rounded-lg border border-sony-surface-light
                                   text-sony-gray hover:text-sony-white hover:border-sony-white/30
                                   transition-all duration-300 cursor-pointer"
                      >
                        Try a different query
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Results */}
        {result && !isLoading && <ResultsPanel result={result} />}

        {/* Conversation history */}
        <ConversationHistory history={history} onNewSearch={handleNewSearch} />
      </main>

      <Footer />
    </div>
  );
}
