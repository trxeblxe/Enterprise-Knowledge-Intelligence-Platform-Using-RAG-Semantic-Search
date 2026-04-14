import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function SourceChunks({ sources = [] }) {
  const [expanded, setExpanded] = useState({});
  const cardRefs = useRef({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expose scroll-to for citation clicks
  useEffect(() => {
    window.__scrollToSource = (index) => {
      const el = cardRefs.current[index];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-sony-red');
        setTimeout(() => el.classList.remove('ring-2', 'ring-sony-red'), 2000);
      }
    };
    return () => { delete window.__scrollToSource; };
  }, []);

  return (
    <motion.div
      id="source-chunks"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-sony-white flex items-center gap-2">
        <span className="w-1.5 h-6 bg-sony-red rounded-full inline-block" />
        Retrieved Knowledge Chunks
      </h2>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {sources.map((source, i) => (
          <motion.div
            key={source.id ?? i}
            ref={(el) => (cardRefs.current[i] = el)}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
            data-source-index={i}
            className="glass rounded-xl p-5 transition-all duration-300 hover:border-sony-red/20"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-sony-gray">
                <FileText size={14} className="text-sony-red" />
                <span className="font-medium text-sony-white">{source.document}</span>
                {source.page && <span>p.{source.page}</span>}
                <span className="text-sony-gray-dark">Chunk #{source.chunkIndex}</span>
              </div>
              <span className="text-xs font-bold text-sony-red bg-sony-red/10 px-2 py-1 rounded-md">
                Source {i + 1}
              </span>
            </div>

            {/* Excerpt */}
            <p className={`text-sm text-sony-white/75 leading-relaxed ${
              expanded[i] ? '' : 'line-clamp-3'
            }`}>
              {source.text}
            </p>

            {source.text.length > 180 && (
              <button
                onClick={() => toggleExpand(i)}
                className="flex items-center gap-1 text-xs text-sony-red mt-2 hover:text-sony-white transition-colors cursor-pointer"
              >
                {expanded[i] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded[i] ? 'Collapse' : 'Expand'}
              </button>
            )}

            {/* Similarity score bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-sony-gray">Similarity</span>
                <span className="text-sony-white font-medium">{source.score.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-sony-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #E4002B, #FF4D6A)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(source.score, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
