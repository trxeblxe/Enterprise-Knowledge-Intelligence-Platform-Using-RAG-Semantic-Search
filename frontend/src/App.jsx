import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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
    setIsLoading(true);
    setError(null);

    try {
      const data = await submitQuery(query);
      setResult(data);
      setHistory((prev) => [...prev, {
        question: data.question || query,
        answer: data.answer,
        sources: data.sources,
        processingTime: data.processingTime,
      }]);
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Something went wrong';
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
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="glass rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sony-red/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sony-red text-lg font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="text-sony-white font-semibold mb-1">Search Failed</h3>
                    <p className="text-sm text-sony-gray">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-3 text-xs text-sony-red hover:text-sony-white transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
