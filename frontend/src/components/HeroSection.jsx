import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ScanLine, Mic } from 'lucide-react';
import SearchBar from './SearchBar';

const SUGGESTION_CHIPS = [
  'Best noise cancelling headphones',
  'Headphones under ₹5000',
  'Best for phone calls',
  'Wireless vs wired comparison',
  'Longest battery life',
];

export default function HeroSection({ onSearch, isLoading, hasResults, activeQuery }) {
  const headphoneRef = useRef(null);
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [activeChip, setActiveChip] = useState(null);
  const MotionDiv = motion.div;
  const MotionButton = motion.button;

  // Gentle wobble instead of full rotation (2D image would vanish edge-on)
  useEffect(() => {
    if (hasResults) return;
    const interval = setInterval(() => {
      setRotation((prev) => prev + 0.02);
    }, 50);
    return () => clearInterval(interval);
  }, [hasResults]);

  // Mouse parallax (subtle)
  const handleMouseMove = (e) => {
    if (!containerRef.current || hasResults) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 8, y: -x * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      ref={containerRef}
      id="hero-section"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Aurora glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="w-[840px] h-[840px] rounded-full animate-aurora"
          style={{
            background: 'radial-gradient(circle, rgba(228,0,43,0.32) 0%, rgba(170,0,72,0.17) 32%, rgba(80,0,40,0.09) 58%, transparent 72%)',
            opacity: 0.65,
          }}
        />
      </div>

      <MotionDiv
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 mb-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sony-surface-light bg-sony-surface/70 text-xs text-sony-gray">
          <Sparkles size={13} className="text-sony-red" />
          Sony Intelligence Console
          <span className="h-1 w-1 rounded-full bg-sony-gray" />
          <ScanLine size={13} />
          Semantic Retrieval Enabled
        </div>
      </MotionDiv>

      {/* Headphone with parallax */}
      <MotionDiv
        ref={headphoneRef}
        className="relative z-10 mb-7"
        animate={hasResults
          ? { y: -520, opacity: 0, scale: 0.45 }
          : { y: 0, opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ perspective: 1000 }}
      >
        <div
          className="animate-float"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y + Math.sin(rotation) * 8}deg)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <img
            src="/headphone.png"
            alt="Sony Headphone"
            className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain select-none"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(228,0,43,0.5)) drop-shadow(0 0 70px rgba(228,0,43,0.23)) brightness(1.25)',
            }}
            draggable={false}
          />
        </div>
      </MotionDiv>

      {/* Hero text */}
      <MotionDiv
        className="text-center z-10 mb-9"
        animate={hasResults ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sony-white mb-4 leading-tight tracking-tight">
          Navigate your audio catalog with{' '}
          <span className="text-gradient-red">Sony Headphones</span>
        </h1>
        <p className="text-sony-gray text-base md:text-lg max-w-2xl mx-auto">
          Ask natural questions, compare product lines, and retrieve cited answers with RAG + semantic vector search.
        </p>
      </MotionDiv>

      {/* Search bar */}
      <MotionDiv
        className="w-full z-10"
        animate={hasResults
          ? { y: -170, scale: 0.93 }
          : { y: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <SearchBar onSearch={onSearch} isLoading={isLoading} />
      </MotionDiv>

      {/* Suggestion chips */}
      {!hasResults && (
        <div className="flex flex-wrap justify-center gap-2 mt-6 z-10 max-w-3xl">
          {SUGGESTION_CHIPS.map((chip, i) => (
            <MotionButton
              key={chip}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
              onClick={() => {
                setActiveChip(chip);
                onSearch(chip);
              }}
              className={`px-4 py-2 rounded-full text-sm border transition-all duration-300 cursor-pointer
                         ${activeChip === chip
                  ? 'text-sony-white border-sony-red/50 bg-sony-red/15'
                  : 'text-sony-gray border-sony-surface-light hover:border-sony-red/40 hover:text-sony-white hover:bg-sony-surface/50'}`}
            >
              {chip}
            </MotionButton>
          ))}
        </div>
      )}

      {!hasResults && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="z-10 mt-5 text-xs text-sony-gray flex items-center gap-2"
        >
          <Mic size={13} className="text-sony-red" />
          Tip: Ask for comparisons, budgets, ANC quality, comfort, or battery life.
          <ArrowRight size={13} />
        </MotionDiv>
      )}

      {hasResults && activeQuery && (
        <MotionDiv
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 mt-4 text-xs text-sony-gray border border-sony-surface-light rounded-full px-3 py-1.5 bg-sony-surface/50"
        >
          Last query: <span className="text-sony-white">{activeQuery}</span>
        </MotionDiv>
      )}
    </section>
  );
}
