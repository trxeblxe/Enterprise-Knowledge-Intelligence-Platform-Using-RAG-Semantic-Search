import { Activity, Clock3, Database, Layers2, Gauge, Cpu } from 'lucide-react';

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-sony-surface-light bg-sony-surface/55 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-sony-gray inline-flex items-center gap-2">
        {Icon ? <Icon size={12} className="text-sony-red" /> : null}
        {label}
      </div>
      <p className="text-sm text-sony-white mt-1 font-semibold">{value}</p>
    </div>
  );
}

export default function SystemHealthPanel({ result }) {
  const sourceCount = result?.sources?.length || 0;
  const confidence = Math.round(result?.confidence || 0);
  const model = result?.modelUsed || 'Fallback mode';
  const latency = result?.processingTime ? `${(result.processingTime / 1000).toFixed(2)}s` : 'N/A';

  const topSource = sourceCount > 0 ? result.sources[0] : null;

  return (
    <section className="rounded-2xl border border-sony-surface-light bg-sony-surface/45 p-4" id="system-health-panel">
      <h4 className="text-sm font-semibold text-sony-white mb-3 inline-flex items-center gap-2">
        <Activity size={15} className="text-sony-red" />
        Retrieval Telemetry
      </h4>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Latency" value={latency} icon={Clock3} />
        <StatCard label="Sources" value={String(sourceCount)} icon={Database} />
        <StatCard label="Confidence" value={`${confidence}%`} icon={Gauge} />
        <StatCard label="Model" value={model} icon={Cpu} />
        <StatCard
          label="Top Doc"
          value={topSource?.document || 'N/A'}
          icon={Layers2}
        />
        <StatCard
          label="Top Score"
          value={topSource ? `${Math.round(topSource.score || 0)}%` : 'N/A'}
          icon={Gauge}
        />
      </div>
    </section>
  );
}
