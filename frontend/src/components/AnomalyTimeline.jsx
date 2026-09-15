import React from 'react';

const W = 1000;
const H = 120;
const WARN_AT = 35;
const CRIT_AT = 70;

function Trace({ data, color, accessor, max, dashed }) {
  if (data.length < 2) return null;
  const d = data
    .map((s, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (Math.max(0, Math.min(max, accessor(s))) / max) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeDasharray={dashed ? '3 3' : undefined}
      vectorEffect="non-scaling-stroke"
      strokeLinejoin="round"
    />
  );
}

export default function AnomalyTimeline({ history, aiDiagnostics, severity }) {
  const score = aiDiagnostics?.anomaly_score ?? 0;
  const causes = aiDiagnostics?.root_causes || [];
  const advisories = aiDiagnostics?.maintenance_advisories || [];
  const isCritical = severity === 'CRITICAL';

  const scoreColor = score >= CRIT_AT ? '#d96b6b' : score >= WARN_AT ? '#d9a441' : '#5fb87f';

  // Area under the anomaly trace
  let area = null;
  if (history.length > 1) {
    const pts = history
      .map((s, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = H - (Math.max(0, Math.min(100, s.score)) / 100) * H;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    area = `${pts} L${W},${H} L0,${H} Z`;
  }

  const priorityChip = (p) =>
    p === 'CRITICAL' ? 'chip-crit' : p === 'WARNING' ? 'chip-warn' : 'chip-mute';

  return (
    <section className={`card p-4 ${isCritical ? 'border-crit/40' : ''}`}>
      <div className="sec-head">
        <div className="flex items-baseline gap-3">
          <h2 className="sec-title">Anomaly Trend</h2>
          <span className="sec-note">
            {history.length > 1 ? `last ${history.length} frames` : 'buffering'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="num-lg" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
          <span className="font-mono text-2xs text-zinc-600">/ 100 score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Chart */}
        <div className="lg:col-span-7">
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[120px]">
              {/* severity bands */}
              <rect x="0" y="0" width={W} height={H * (1 - CRIT_AT / 100)} fill="rgba(217,107,107,0.05)" />
              <rect x="0" y={H * (1 - CRIT_AT / 100)} width={W} height={H * ((CRIT_AT - WARN_AT) / 100)} fill="rgba(217,164,65,0.045)" />

              {/* thresholds */}
              <line x1="0" x2={W} y1={H * (1 - CRIT_AT / 100)} y2={H * (1 - CRIT_AT / 100)}
                    stroke="rgba(217,107,107,0.45)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              <line x1="0" x2={W} y1={H * (1 - WARN_AT / 100)} y2={H * (1 - WARN_AT / 100)}
                    stroke="rgba(217,164,65,0.4)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />

              {area && <path d={area} fill="rgba(122,162,196,0.10)" />}
              <Trace data={history} color="#c2d6e6" accessor={(s) => s.score} max={100} />
              <Trace data={history} color="#5fb87f" accessor={(s) => s.ehi} max={100} dashed />
            </svg>

            {/* y labels */}
            <div className="absolute inset-y-0 -left-0 pointer-events-none flex flex-col justify-between py-0">
              <span className="font-mono text-2xs text-zinc-700 bg-base-2 px-1">100</span>
              <span className="font-mono text-2xs text-zinc-700 bg-base-2 px-1">0</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500">
                <span className="w-3 h-px bg-steel-200" /> anomaly score
              </span>
              <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500">
                <span className="w-3 border-t border-dashed border-ok" /> health index
              </span>
            </div>
            <span className="font-mono text-2xs text-zinc-600">
              warn {WARN_AT} · crit {CRIT_AT}
            </span>
          </div>
        </div>

        {/* Root cause + directives.
            This column is a flex column whose findings area flexes: giving the
            empty state h-full instead pushed the advisories block past the card
            boundary, where the following section overlapped it. */}
        <div className="lg:col-span-5 lg:border-l lg:border-white/[0.06] lg:pl-5 flex flex-col min-w-0">
          {causes.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center py-2">
              <span className="chip chip-ok self-start mb-2">No active findings</span>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Physics residuals within bounds across all monitored channels. No divergence
                between the thermodynamic model and measured telemetry.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-2.5 animate-slide-up">
              {causes.map((c, i) => (
                <div key={c.code || i} className="border-l-2 border-crit pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-cond font-semibold text-[13px] text-zinc-100 leading-tight">
                      {c.title}
                    </span>
                    <span className="num text-[12.5px] text-crit flex-shrink-0">{c.confidence}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="chip chip-mute !py-0">{c.subsystem}</span>
                    <span className="font-mono text-2xs text-zinc-600">{c.code}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1.5">{c.evidence}</p>
                </div>
              ))}
            </div>
          )}

          {advisories.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
              <span className="label">Maintenance directive</span>
              {advisories.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`chip ${priorityChip(a.priority)} flex-shrink-0 mt-[1px]`}>
                    {a.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-300 leading-snug">{a.action}</p>
                    <span className="font-mono text-2xs text-zinc-600">Downtime {a.downtime_est}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
