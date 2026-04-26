import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Timer, Cpu, Quote, BookOpenText } from 'lucide-react';
import { useTypewriter } from '../hooks/useTypewriter';
import ConfidenceRing from './ConfidenceRing';

const MotionDiv = motion.div;

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
    <MotionDiv
      id="answer-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold text-sony-white flex items-center gap-2">
        <span className="w-1.5 h-6 bg-sony-red rounded-full inline-block" />
        Answer Workspace
      </h2>

      <div className="glass rounded-2xl p-5 border border-sony-surface-light">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-sony-surface-light/60">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-sony-gray">
            <Bot size={13} className="text-sony-red" />
            Retrieved Answer
          </div>
          <div className="text-[11px] text-sony-gray">
            Click citation badges like <span className="text-sony-white">[Source 1]</span> to jump to evidence
          </div>
        </div>
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
          <div className="text-xs text-sony-gray inline-flex items-center gap-2">
            <Timer size={13} className="text-sony-red" />
            <span className="text-sony-white font-medium">{(processingTime / 1000).toFixed(2)}s</span> response time
          </div>
        )}
        {modelUsed && (
          <div className="text-xs text-sony-gray inline-flex items-center gap-2">
            <Cpu size={13} className="text-sony-red" />
            Model: <span className="text-sony-white font-medium">{modelUsed}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-sony-surface-light p-3 bg-sony-surface/45">
          <div className="text-[11px] text-sony-gray uppercase tracking-[0.12em] inline-flex items-center gap-2">
            <Quote size={12} className="text-sony-red" />
            Grounded response
          </div>
          <p className="text-sm text-sony-white/85 mt-2">
            The answer is stitched from retrieved chunks and clearly linked with source references.
          </p>
        </div>
        <div className="rounded-xl border border-sony-surface-light p-3 bg-sony-surface/45">
          <div className="text-[11px] text-sony-gray uppercase tracking-[0.12em] inline-flex items-center gap-2">
            <BookOpenText size={12} className="text-sony-red" />
            Verification tip
          </div>
          <p className="text-sm text-sony-white/85 mt-2">
            Open the source cards to verify model claims against the original product context.
          </p>
        </div>
      </div>
    </MotionDiv>
  );
}
