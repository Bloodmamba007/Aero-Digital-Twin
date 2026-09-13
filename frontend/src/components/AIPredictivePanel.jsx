import React from 'react';
import { 
  Cpu, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  TrendingDown, 
  Activity,
  Layers,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function AIPredictivePanel({ aiDiagnostics, prognostics }) {
  const anomalyScore = aiDiagnostics?.anomaly_score || 5.0;
  const severity = aiDiagnostics?.severity || 'NOMINAL';
  const rootCauses = aiDiagnostics?.root_causes || [];
  const advisories = aiDiagnostics?.maintenance_advisories || [];

  const overallHealth = prognostics?.overall_health_index || 95.0;
  const subHealth = prognostics?.subsystem_health || {
    combustion: 96,
    thermal: 94,
    lubrication: 98,
    mechanical: 95,
    electrical: 99
  };
  const wear = prognostics?.wear_metrics || {
    valve_seat_wear_pct: 18.2,
    turbo_bearing_wear_pct: 22.4,
    piston_ring_wear_pct: 19.1,
    oil_degradation_pct: 28.5,
    spark_plug_erosion_pct: 31.0
  };
  const rul = prognostics?.rul_hours || { mean: 852.0, lower_95_ci: 780.0, upper_95_ci: 920.0 };

  const getHealthColor = (val) => {
    if (val >= 80) return 'text-emerald-400';
    if (val >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getHealthBarColor = (val) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
            AI Prognostics & Predictive Diagnostics
          </h2>
        </div>
        <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          ISO-FOREST + PHYSICS-XAI
        </span>
      </div>

      {/* Top Metrics: Overall Health & RUL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        
        {/* Overall Engine Health Index */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code text-slate-400 block mb-1">OVERALL ENGINE HEALTH (EHI)</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono-code tracking-tight ${getHealthColor(overallHealth)}`}>
                {overallHealth.toFixed(1)}%
              </span>
              <span className="text-xs font-mono-code text-slate-500">NOMINAL &gt;80%</span>
            </div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Circular Gauge Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={overallHealth > 75 ? 'text-emerald-500' : (overallHealth > 50 ? 'text-amber-500' : 'text-red-500')}
                strokeDasharray={`${overallHealth}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-bold font-mono-code text-slate-200">
              {Math.round(overallHealth)}
            </span>
          </div>
        </div>

        {/* Remaining Useful Life (RUL) Countdown */}
        <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code text-slate-400 block mb-1">REMAINING USEFUL LIFE (RUL)</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono-code tracking-tight ${rul.mean < 50 ? 'text-red-400 animate-pulse' : (rul.mean < 200 ? 'text-amber-400' : 'text-cyan-300')}`}>
                {rul.mean.toFixed(1)}
              </span>
              <span className="text-xs font-mono-code text-slate-400">FLIGHT HRS</span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-500 block mt-0.5">
              95% CI: [{rul.lower_95_ci.toFixed(0)} - {rul.upper_95_ci.toFixed(0)} hrs]
            </span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-mono-code text-slate-500">TBO LIMIT</span>
            <span className="text-xs font-mono-code text-slate-300 font-bold">1200.0 HRS</span>
            <span className="text-[10px] font-mono-code text-cyan-400 mt-1">
              {prognostics?.accumulated_flight_hours?.toFixed(1) || '342.5'} ACCUM
            </span>
          </div>
        </div>

      </div>

      {/* Subsystem Health Indices Radar / Bars */}
      <div className="mb-4">
        <span className="text-xs font-mono-code text-slate-400 block mb-2">SUBSYSTEM HEALTH STATUS</span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(subHealth).map(([sub, val]) => (
            <div key={sub} className="bg-tactical-950/60 border border-slate-800/80 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-slate-400 uppercase">{sub}</span>
              <span className={`text-base font-bold font-mono-code ${getHealthColor(val)} my-1`}>
                {val.toFixed(0)}%
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${getHealthBarColor(val)}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Wear Breakdown */}
      <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-xs font-mono-code text-slate-400 mb-2">
          <span>DEGRADATION & WEAR METRICS</span>
          <span className="text-slate-500">CRITICAL LIMIT: 100%</span>
        </div>
        <div className="space-y-2">
          {Object.entries(wear).map(([metric, pct]) => {
            const label = metric.replace('_pct', '').replace(/_/g, ' ').toUpperCase();
            return (
              <div key={metric} className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400 text-[11px] w-40 truncate">{label}</span>
                <div className="flex-1 mx-3 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${pct > 70 ? 'bg-red-500' : (pct > 40 ? 'bg-amber-400' : 'bg-cyan-500')}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className={`font-bold w-12 text-right ${pct > 70 ? 'text-red-400' : 'text-slate-300'}`}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainable AI (XAI) Diagnostic Cards */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono-code text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            DIAGNOSED ANOMALIES ({rootCauses.length})
          </span>
          <span className={`font-bold ${anomalyScore > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
            ANOMALY SCORE: {anomalyScore.toFixed(1)}/100
          </span>
        </div>

        {rootCauses.length === 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 flex items-center gap-2.5 text-xs text-emerald-300 font-mono-code">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero anomalous physical deviations detected. Engine operating in pristine airworthiness envelope.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {rootCauses.map((fault, idx) => (
              <div key={idx} className="bg-red-950/20 border border-red-800/60 rounded-lg p-2.5 font-mono-code text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {fault.title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-900/40 text-red-300 text-[10px] border border-red-700">
                    CONFIDENCE {fault.confidence}%
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">{fault.evidence}</p>
              </div>
            ))}
          </div>
        )}

        {/* Prescriptive Maintenance Advisories */}
        {advisories.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-mono-code text-slate-500 block mb-1">PRESCRIPTIVE MAINTENANCE DIRECTIVE:</span>
            {advisories.map((adv, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-mono-code text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-800/80">
                <Wrench className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-amber-300 font-semibold">{adv.action}</span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">Est. Ground Downtime: {adv.downtime_est}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
