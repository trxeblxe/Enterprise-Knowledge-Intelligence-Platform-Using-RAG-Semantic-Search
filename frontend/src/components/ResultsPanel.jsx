import { motion } from 'framer-motion';
import AnswerPanel from './AnswerPanel';
import SourceChunks from './SourceChunks';

export default function ResultsPanel({ result }) {
  if (!result) return null;

  const handleSourceClick = (index) => {
    window.__scrollToSource?.(index);
  };

  return (
    <motion.div
      id="results-panel"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Answer - 60% */}
        <div className="lg:col-span-3">
          <AnswerPanel
            answer={result.answer}
            confidence={result.confidence}
            processingTime={result.processingTime}
            modelUsed={result.modelUsed}
            onSourceClick={handleSourceClick}
          />
        </div>

        {/* Sources - 40% */}
        <div className="lg:col-span-2">
          <SourceChunks sources={result.sources} />
        </div>
      </div>
    </motion.div>
  );
}
