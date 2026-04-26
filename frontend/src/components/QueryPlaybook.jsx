import { motion } from 'framer-motion';
import { Lightbulb, BadgeHelp, Scale, Headphones, Battery, PhoneCall } from 'lucide-react';

const PLAYBOOK_ITEMS = [
  {
    icon: Headphones,
    title: 'Category Discovery',
    query: 'Show me the best over-ear ANC headphones for office and travel',
    tip: 'Great for broad recommendation requests.',
  },
  {
    icon: Scale,
    title: 'Head-to-Head Comparison',
    query: 'Compare WH-1000XM5 and WH-CH720N for call quality, battery, and comfort',
    tip: 'Use "compare X vs Y" to get direct tradeoffs.',
  },
  {
    icon: Battery,
    title: 'Spec-Driven Search',
    query: 'Which Sony headphones provide the longest battery life with ANC enabled?',
    tip: 'Ask by priority: battery, comfort, ANC, gaming, calls.',
  },
  {
    icon: PhoneCall,
    title: 'Use-Case Targeting',
    query: 'Best Sony option for phone calls in noisy outdoor environments',
    tip: 'Mention your environment for better retrieval.',
  },
];

export default function QueryPlaybook({ onRunPreset }) {
  const MotionButton = motion.button;

  return (
    <section className="max-w-7xl mx-auto px-6 py-8" id="query-playbook">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sony-white inline-flex items-center gap-2">
          <Lightbulb size={17} className="text-sony-red" />
          Query Playbook
        </h3>
        <div className="text-xs text-sony-gray inline-flex items-center gap-1">
          <BadgeHelp size={13} />
          Starter prompts
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {PLAYBOOK_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <MotionButton
              key={item.title}
              type="button"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onRunPreset?.(item.query)}
              className="text-left card-elevated rounded-xl p-4 hover:border-sony-red/35 transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-sony-red/15 border border-sony-red/35 flex items-center justify-center mb-3">
                <Icon size={14} className="text-sony-red" />
              </div>
              <p className="text-sm text-sony-white font-semibold">{item.title}</p>
              <p className="text-xs text-sony-gray mt-1 line-clamp-2">{item.query}</p>
              <p className="text-[11px] text-sony-gray-dark mt-2 group-hover:text-sony-gray transition-colors">
                {item.tip}
              </p>
            </MotionButton>
          );
        })}
      </div>
    </section>
  );
}
