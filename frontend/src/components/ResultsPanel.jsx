import { motion } from 'framer-motion';
import { FileSearch, ShieldCheck, BrainCircuit } from 'lucide-react';
import AnswerPanel from './AnswerPanel';
import SourceChunks from './SourceChunks';
import SystemHealthPanel from './SystemHealthPanel';

export default function ResultsPanel({ result }) {
  if (!result) return null;
  const MotionDiv = motion.div;

  const handleSourceClick = (index) => {
    window.__scrollToSource?.(index);
  };

  return (
    <MotionDiv
      id="results-panel"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-7xl mx-auto px-6 py-10"
    >
      <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-xl px-4 py-3 border border-sony-surface-light">
          <div className="text-[11px] uppercase tracking-[0.12em] text-sony-gray flex items-center gap-2">
            <FileSearch size={12} className="text-sony-red" />
            Query Pipeline
          </div>
          <div className="text-sm text-sony-white mt-1">Semantic retrieval complete</div>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-sony-surface-light">
          <div className="text-[11px] uppercase tracking-[0.12em] text-sony-gray flex items-center gap-2">
            <ShieldCheck size={12} className="text-sony-red" />
            Citation Mode
          </div>
          <div className="text-sm text-sony-white mt-1">{result.sources?.length || 0} grounded references attached</div>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-sony-surface-light">
          <div className="text-[11px] uppercase tracking-[0.12em] text-sony-gray flex items-center gap-2">
            <BrainCircuit size={12} className="text-sony-red" />
            Inference
          </div>
          <div className="text-sm text-sony-white mt-1">{result.modelUsed || 'Model unavailable (fallback mode)'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Answer - 60% */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <SystemHealthPanel result={result} />
          </div>
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
    </MotionDiv>
  );
}
