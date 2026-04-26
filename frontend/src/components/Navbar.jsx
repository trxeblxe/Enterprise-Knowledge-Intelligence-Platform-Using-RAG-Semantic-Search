import { useState, useEffect } from 'react';
import { Activity, AudioLines, Shield } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-[0.3em] text-sony-white">
            SONY
          </span>
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-sony-gray border border-sony-surface-light rounded-full px-2 py-1">
            <AudioLines size={11} className="text-sony-red" />
            AUDIO KNOWLEDGE
          </div>
        </div>

        {/* Center subtitle */}
        <div className="hidden md:block">
          <span className="text-sm tracking-widest text-sony-gray uppercase">Knowledge Intelligence Platform</span>
        </div>

        {/* AI Active badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sony-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sony-red" />
          </span>
          <Activity size={14} className="text-sony-red" />
          <span className="text-xs font-medium text-sony-gray">AI Active</span>
          <Shield size={12} className="text-sony-gray" />
        </div>
      </div>

      {/* Red underline */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-sony-red to-transparent opacity-60" />
    </nav>
  );
}
