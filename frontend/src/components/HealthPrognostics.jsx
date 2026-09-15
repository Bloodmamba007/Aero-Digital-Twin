import React from 'react';
import Sparkline from './Sparkline';

/* Backend currently emits subsystem_health.thermal above 100 (seen at 121-122).
   A health index cannot exceed 100, so values are clamped for both the bar
   geometry and the printed figure rather than rendering an overflowing bar. */
const clampHealth = (v) => Math.max(0, Math.min(100, v ?? 0));

const healthColor = (v) => (v >= 80 ? '#5fb87f' : v >= 60 ? '#d9a441' : '#d96b6b');
const healthText = (v) => (v >= 80 ? 'text-ok' : v >= 60 ? 'text-warn' : 'text-crit');

function SubsystemBar({ name, value }) {
  const v = clampHealth(value);
  return (
    <div className="flex items-center gap-3 py-[7px]">
      <span className="text-xs text-zinc-400 capitalize w-[92px] flex-shrink-0">{name}</span>
      <div className="bar h-[6px] flex-1">
        <div className="bar-fill" style={{ width: `${v}%`, background: healthColor(v) }} />
      </div>
      <span className={`num text-[12.5px] w-11 text-right ${healthText(v)}`}>{v.toFixed(0)}%</span>
    </div>
  );
}

function WearBar({ name, pct }) {
  const v = Math.max(0, Math.min(100, pct ?? 0));
  const color = v > 70 ? '#d96b6b' : v > 40 ? '#d9a441' : '#5b8db8';
  return (
    <div className="flex items-center gap-3 py-[6px]">
      <span className="text-xs text-zinc-400 capitalize w-[132px] flex-shrink-0 truncate">{name}</span>
      <div className="bar h-[5px] flex-1">
        <div className="bar-fill" style={{ width: `${v}%`, background: color }} />
      </div>
      <span className="num text-[12px] w-12 text-right text-zinc-400">{v.toFixed(1)}%</span>
    </div>
  );
}

export default function HealthPrognostics({ aiDiagnostics, prognostics, history }) {
  const ehi = clampHealth(prognostics?.overall_health_index);
  const sub = prognostics?.subsystem_health || {};
  const wear = prognostics?.wear_metrics || {};
  const rul = prognostics?.rul_hours || { mean: 0, lower_95_ci: 0, upper_95_ci: 0 };
  const accum = prognostics?.accumulated_flight_hours || 0;
  const tbo = prognostics?.tbo_limit_hours || 1200;

  const rulCritical = rul.mean < 50;
  const rulCaution = rul.mean < 200;
  const rulColor = rulCritical ? '#d96b6b' : rulCaution ? '#d9a441' : '#c2d6e6';

  // The CI band gets its own scale rather than being drawn against the full
  // remaining-TBO envelope: when RUL collapses to ~12 h against an ~857 h
  // envelope the band renders as a 1% sliver pinned to the left edge, which
  // reads as a broken widget at exactly the moment it is most important.
  // Remaining TBO is shown separately as context below.
  const ciLo = rul.lower_95_ci;
  const ciHi = rul.upper_95_ci;
  const ciPad = Math.max((ciHi - ciLo) * 0.6, ciHi * 0.12, 1);
  const axisLo = Math.max(0, ciLo - ciPad);
  const axisHi = ciHi + ciPad;
  const pos = (v) => `${Math.max(0, Math.min(100, ((v - axisLo) / (axisHi - axisLo || 1)) * 100))}%`;

  const remainingTbo = Math.max(tbo - accum, 0);
  const tboUsedPct = Math.max(0, Math.min(100, (accum / (tbo || 1)) * 100));

  const ehiTrend = history.map((h) => h.ehi);

  return (
    <section className="card p-4">
      <div className="sec-head">
        <h2 className="sec-title">Prognostics &amp; Remaining Life</h2>
        <span className="sec-note">Isolation Forest · physics-residual XAI</span>
      </div>

      {/* Headline pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        <div className="card-lift p-3.5">
          <div className="flex items-start justify-between">
            <span className="label">Engine Health Index</span>
            <span className={`chip ${ehi >= 80 ? 'chip-ok' : ehi >= 60 ? 'chip-warn' : 'chip-crit'}`}>
              {ehi >= 80 ? 'Serviceable' : ehi >= 60 ? 'Degraded' : 'Unserviceable'}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div className="flex items-baseline">
              <span className="num-xl" style={{ color: healthColor(ehi) }}>{ehi.toFixed(1)}</span>
              <span className="unit">%</span>
            </div>
            <Sparkline data={ehiTrend} color={healthColor(ehi)} width={110} height={30} min={0} max={100} />
          </div>
          <div className="bar h-[6px] mt-3">
            <div className="bar-fill" style={{ width: `${ehi}%`, background: healthColor(ehi) }} />
          </div>
        </div>

        <div className="card-lift p-3.5">
          <div className="flex items-start justify-between">
            <span className="label">Remaining Useful Life</span>
            <span className="font-mono text-2xs text-zinc-600">95% CI</span>
          </div>
          <div className="flex items-baseline mt-2">
            <span className="num-xl" style={{ color: rulColor }}>{rul.mean.toFixed(1)}</span>
            <span className="unit">flight hrs</span>
          </div>

          {/* 95% CI band on its own scale */}
          <div className="relative h-[8px] mt-3 rounded-sm bg-white/[0.06]">
            <div
              className="absolute top-0 bottom-0 rounded-sm opacity-45 transition-all duration-500"
              style={{
                left: pos(ciLo),
                right: `${100 - parseFloat(pos(ciHi))}%`,
                background: rulColor,
              }}
            />
            <div
              className="absolute top-[-3px] bottom-[-3px] w-[2px] rounded transition-all duration-500"
              style={{ left: pos(rul.mean), background: rulColor }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-2xs text-zinc-600">
            <span>{ciLo.toFixed(1)} h</span>
            <span className="text-zinc-500">95% interval</span>
            <span>{ciHi.toFixed(1)} h</span>
          </div>

          {/* TBO context, separate scale */}
          <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
            <div className="flex justify-between font-mono text-2xs text-zinc-600 mb-1">
              <span>{accum.toFixed(1)} h flown</span>
              <span>{remainingTbo.toFixed(0)} h to TBO {tbo.toFixed(0)}</span>
            </div>
            <div className="bar h-[4px]">
              <div className="bar-fill bg-steel-600" style={{ width: `${tboUsedPct}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* Subsystems + wear side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <span className="label block mb-1.5">Subsystem Health</span>
          <div>
            {Object.entries(sub).map(([k, v]) => (
              <SubsystemBar key={k} name={k} value={v} />
            ))}
          </div>
        </div>

        <div>
          <span className="label block mb-1.5">Component Wear</span>
          <div>
            {Object.entries(wear).map(([k, v]) => (
              <WearBar key={k} name={k.replace('_pct', '').replace(/_/g, ' ')} pct={v} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
