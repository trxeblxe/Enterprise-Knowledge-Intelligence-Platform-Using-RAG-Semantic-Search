import { Database, Brain, Cpu, Sparkles, ShieldCheck, GaugeCircle } from 'lucide-react';

const TECH_BADGES = [
  { label: 'RAG Pipeline', icon: Brain },
  { label: 'FAISS Vector Store', icon: Database },
  { label: 'LangChain', icon: Sparkles },
  { label: 'Gemini LLM', icon: Cpu },
  { label: 'Citation Grounding', icon: ShieldCheck },
  { label: 'Confidence Metrics', icon: GaugeCircle },
];

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-sony-surface mt-14">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-sony-gray-dark uppercase tracking-widest">Built with</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH_BADGES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sony-surface/50
                           border border-sony-surface-light text-xs text-sony-gray"
              >
                {Icon ? <Icon size={12} className="text-sony-red" /> : null}
                {label}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-sony-gray-dark mt-2">Enterprise Knowledge Intelligence Platform</p>
            <p className="text-[11px] text-sony-gray mt-1">
              Retrieval-augmented answers with semantic ranking and source attribution.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
