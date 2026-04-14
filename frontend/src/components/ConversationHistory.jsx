import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, RotateCcw, Bot, User } from 'lucide-react';

export default function ConversationHistory({ history = [], onNewSearch }) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div id="conversation-history" className="max-w-7xl mx-auto px-6 pb-8">
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-5 glass rounded-xl
                   hover:border-sony-red/20 transition-all cursor-pointer mb-2"
      >
        <span className="text-sm font-medium text-sony-gray">
          Conversation History ({history.length} {history.length === 1 ? 'exchange' : 'exchanges'})
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onNewSearch?.(); }}
            className="flex items-center gap-1 text-xs text-sony-red hover:text-sony-white transition-colors cursor-pointer"
          >
            <RotateCcw size={12} /> New Search
          </button>
          {isOpen ? <ChevronDown size={16} className="text-sony-gray" /> : <ChevronUp size={16} className="text-sony-gray" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl p-5 max-h-96 overflow-y-auto space-y-4">
              {history.map((item, i) => (
                <div key={i} className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-[75%]">
                      <div className="bg-sony-surface-light rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm text-sony-white">{item.question}</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-sony-surface-light flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={14} className="text-sony-gray" />
                      </div>
                    </div>
                  </div>

                  {/* AI message */}
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[75%]">
                      <div className="w-7 h-7 rounded-full bg-sony-red/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-sony-red" />
                      </div>
                      <div className="bg-sony-surface rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-sony-white/80 line-clamp-4">{item.answer}</p>
                        <p className="text-xs text-sony-gray mt-1">
                          {item.sources?.length || 0} sources | {((item.processingTime || 0) / 1000).toFixed(2)}s
                        </p>
                      </div>
                    </div>
                  </div>

                  {i < history.length - 1 && (
                    <div className="border-t border-sony-surface-light/50" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
