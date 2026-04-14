import { Database, Brain, Cpu, Sparkles } from 'lucide-react';

const TECH_BADGES = [
  { label: 'RAG Pipeline', icon: Brain },
  { label: 'FAISS Vector Store', icon: Database },
  { label: 'LangChain', icon: Sparkles },
  { label: 'Gemini LLM', icon: Cpu },
];

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-sony-surface mt-12">
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
                <Icon size={12} className="text-sony-red" />
                {label}
              </div>
            ))}
          </div>
          <p className="text-xs text-sony-gray-dark mt-2">
            Enterprise Knowledge Intelligence Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
