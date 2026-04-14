import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '../hooks/useTypewriter';
import ConfidenceRing from './ConfidenceRing';

export default function AnswerPanel({ answer, confidence, processingTime, modelUsed, onSourceClick }) {
  const { displayedText, isTyping } = useTypewriter(answer, 8, !!answer);

  // Parse citation badges [Source N] from the answer text
  const renderedText = useMemo(() => {
    if (!displayedText) return null;
    const parts = displayedText.split(/(\[Source\s*\d+[^\]]*\])/gi);
    return parts.map((part, i) => {
      const match = part.match(/\[Source\s*(\d+)[^\]]*\]/i);
      if (match) {
        const sourceIndex = parseInt(match[1], 10) - 1;
        return (
          <button
            key={i}
            onClick={() => onSourceClick?.(sourceIndex)}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 text-xs font-semibold
                       bg-sony-red/20 text-sony-red border border-sony-red/30 rounded-md
                       hover:bg-sony-red/30 transition-colors cursor-pointer align-baseline"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }, [displayedText, onSourceClick]);

  return (
    <motion.div
      id="answer-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold text-sony-white flex items-center gap-2">
        <span className="w-1.5 h-6 bg-sony-red rounded-full inline-block" />
        AI Answer
      </h2>

      <div className="glass rounded-2xl p-6">
        <div className="text-sony-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">
          {renderedText}
          {isTyping && (
            <span className="inline-block w-0.5 h-5 bg-sony-red ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <ConfidenceRing value={confidence} />
        {processingTime > 0 && (
          <div className="text-xs text-sony-gray">
            <span className="text-sony-white font-medium">{(processingTime / 1000).toFixed(2)}s</span> response time
          </div>
        )}
        {modelUsed && (
          <div className="text-xs text-sony-gray">
            Model: <span className="text-sony-white font-medium">{modelUsed}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
