import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchBar from './SearchBar';

const SUGGESTION_CHIPS = [
  'Best noise cancelling headphones',
  'Headphones under ₹5000',
  'Best for phone calls',
  'Wireless vs wired comparison',
  'Longest battery life',
];

export default function HeroSection({ onSearch, isLoading, hasResults }) {
  const headphoneRef = useRef(null);
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

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
          className="w-[700px] h-[700px] rounded-full animate-aurora"
          style={{
            background: 'radial-gradient(circle, rgba(228,0,43,0.35) 0%, rgba(150,0,60,0.2) 30%, rgba(80,0,40,0.1) 50%, transparent 70%)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Headphone with parallax */}
      <motion.div
        ref={headphoneRef}
        className="relative z-10 mb-8"
        animate={hasResults
          ? { y: -600, opacity: 0, scale: 0.5 }
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
            className="w-64 h-64 md:w-80 md:h-80 object-contain select-none"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(228,0,43,0.5)) drop-shadow(0 0 60px rgba(228,0,43,0.25)) brightness(1.3)',
            }}
            draggable={false}
          />
        </div>
      </motion.div>

      {/* Hero text */}
      <motion.div
        className="text-center z-10 mb-8"
        animate={hasResults ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sony-white mb-4 leading-tight">
          Ask anything about{' '}
          <span className="text-gradient-red">Sony Headphones</span>
        </h1>
        <p className="text-sony-gray text-base md:text-lg max-w-xl mx-auto">
          Powered by RAG + Semantic Vector Search
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        className="w-full z-10"
        animate={hasResults
          ? { y: -200, scale: 0.92 }
          : { y: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <SearchBar onSearch={onSearch} isLoading={isLoading} />
      </motion.div>

      {/* Suggestion chips */}
      {!hasResults && (
        <div className="flex flex-wrap justify-center gap-2 mt-6 z-10 max-w-2xl">
          {SUGGESTION_CHIPS.map((chip, i) => (
            <motion.button
              key={chip}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
              onClick={() => onSearch(chip)}
              className="px-4 py-2 rounded-full text-sm text-sony-gray border border-sony-surface-light
                         hover:border-sony-red/40 hover:text-sony-white hover:bg-sony-surface/50
                         transition-all duration-300 cursor-pointer"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
