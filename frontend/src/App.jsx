import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock3,
  Database,
} from 'lucide-react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ParticleBackground from './components/ParticleBackground';
import LoadingSkeleton from './components/LoadingSkeleton';
import ResultsPanel from './components/ResultsPanel';
import ConversationHistory from './components/ConversationHistory';
import Footer from './components/Footer';
import QueryPlaybook from './components/QueryPlaybook';
import { submitQuery } from './api/client';

const MotionDiv = motion.div;

function StatusStrip({ isLoading, result, error, historyCount }) {
  const items = useMemo(
    () => [
      {
        label: isLoading ? 'Querying' : 'Engine',
        value: isLoading ? 'Thinking...' : 'Ready',
        icon: isLoading ? Clock3 : CheckCircle2,
        tone: isLoading ? 'text-amber-300 border-amber-300/30 bg-amber-300/10' : 'text-emerald-300 border-emerald-300/30 bg-emerald-300/10',
      },
      {
        label: 'Sources',
        value: result?.sources?.length ? `${result.sources.length} retrieved` : 'Waiting',
        icon: Database,
        tone: 'text-sony-gray border-sony-surface-light bg-sony-surface/50',
      },
      {
        label: 'Session',
        value: `${historyCount} queries`,
        icon: Sparkles,
        tone: 'text-sony-gray border-sony-surface-light bg-sony-surface/50',
      },
      {
        label: 'Last Error',
        value: error ? 'Needs attention' : 'None',
        icon: AlertTriangle,
        tone: error ? 'text-sony-red border-sony-red/40 bg-sony-red/10' : 'text-sony-gray border-sony-surface-light bg-sony-surface/50',
      },
    ],
    [error, historyCount, isLoading, result?.sources?.length],
  );

  return (
    <div className="max-w-7xl mx-auto px-6 mt-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`rounded-xl border px-3 py-2 ${tone}`}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] opacity-90">
              {Icon ? <Icon size={13} /> : null}
              {label}
            </div>
            <div className="text-sm font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ error, onDismiss, onReset }) {
  return (
    <MotionDiv
      key="error-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto px-6 py-8"
    >
      <div className="glass rounded-2xl p-6 border border-red-500/35">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-sony-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-sony-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-sony-white text-xl font-semibold mb-1">Search Failed</h3>
            <p className="text-sm text-sony-gray leading-relaxed">{error}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={onDismiss}
                className="text-xs px-4 py-2 rounded-lg bg-sony-red/20 text-sony-red
                           hover:bg-sony-red hover:text-white transition-all duration-300 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={onReset}
                className="text-xs px-4 py-2 rounded-lg border border-sony-surface-light
                           text-sony-gray hover:text-sony-white hover:border-sony-white/30
                           transition-all duration-300 cursor-pointer"
              >
                Reset Search View
              </button>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeQuery, setActiveQuery] = useState('');

  const handleSearch = useCallback(async (query) => {
    if (!query || !query.trim()) return;

    const trimmed = query.trim();
    setActiveQuery(trimmed);
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await submitQuery(trimmed);
      setResult(data);
      setHistory((prev) => [
        ...prev,
        {
          question: data.question || trimmed,
          answer: data.answer,
          sources: data.sources,
          processingTime: data.processingTime,
          confidence: data.confidence,
          modelUsed: data.modelUsed,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
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
    setActiveQuery('');
  };

  const hasResults = !!(result || isLoading);

  return (
    <div className="relative min-h-screen bg-sony-black">
      <ParticleBackground />
      <Navbar />

      <main className="relative z-10">
        <HeroSection
          onSearch={handleSearch}
          isLoading={isLoading}
          hasResults={hasResults}
          activeQuery={activeQuery}
        />

        <StatusStrip
          isLoading={isLoading}
          result={result}
          error={error}
          historyCount={history.length}
        />

        {!hasResults && (
          <QueryPlaybook onRunPreset={handleSearch} />
        )}

        <AnimatePresence>
          {error && (
            <ErrorPanel
              error={error}
              onDismiss={() => setError(null)}
              onReset={() => {
                setError(null);
                setResult(null);
              }}
            />
          )}
        </AnimatePresence>

        {isLoading && <LoadingSkeleton />}
        {result && !isLoading && <ResultsPanel result={result} />}

        <ConversationHistory history={history} onNewSearch={handleNewSearch} />
      </main>

      <Footer />
    </div>
  );
}
