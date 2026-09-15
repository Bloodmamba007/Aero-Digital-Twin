import React, { useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';

const PROFILES = [
  { key: 'ISR_LOITER', label: 'ISR Loiter', sub: '15,000 ft · 74% pwr' },
  { key: 'ALTITUDE_CLIMB', label: 'Tactical Climb', sub: '0 → 22,000 ft' },
  { key: 'DESERT_HEAT_SOAK', label: 'Desert Soak', sub: 'Thar · +45 °C' },
  { key: 'SNAP_THROTTLE', label: 'Snap Throttle', sub: '35% → 98% steps' },
];

export default function MissionControlPanel({
  currentProfile,
  activeFaults,
  onSelectProfile,
  onInjectFault,
  onClearFaults,
  replayState,
  onReplayControl,
}) {
  const [selectedSortie, setSelectedSortie] = useState('SORTIE_TAPAS_08_MISFIRE');
  const isReplaying = Boolean(replayState?.is_replay);

  const faults = [
    {
      id: 'misfire',
      label: 'Cyl #3 misfire',
      effect: 'EGT collapse · torsional jitter',
      active: activeFaults?.misfire_cyl === 3,
      toggle: () => onInjectFault('misfire_cyl', activeFaults?.misfire_cyl === 3 ? null : 3),
    },
    {
      id: 'injector',
      label: 'Injector #1 restriction',
      effect: 'Lean burn > 875 °C',
      active: activeFaults?.clogged_injector_cyl === 1,
      toggle: () => onInjectFault('clogged_injector_cyl', activeFaults?.clogged_injector_cyl === 1 ? null : 1),
    },
    {
      id: 'radiator',
      label: 'Radiator restriction',
      effect: 'Cooling loss · CHT > 140 °C',
      active: activeFaults?.cooling_degradation_factor < 0.8,
      toggle: () => onInjectFault('cooling_degradation_factor', activeFaults?.cooling_degradation_factor < 0.8 ? 1.0 : 0.45),
    },
    {
      id: 'oil',
      label: 'Oil scavenge leak',
      effect: 'Pressure below 190 kPa',
      active: activeFaults?.oil_leak_severity > 0,
      toggle: () => onInjectFault('oil_leak_severity', activeFaults?.oil_leak_severity > 0 ? 0.0 : 0.75),
    },
    {
      id: 'bearing',
      label: 'Bearing degradation',
      effect: 'Harmonic spike > 3.5 G',
      active: activeFaults?.bearing_wear_severity > 0,
      toggle: () => onInjectFault('bearing_wear_severity', activeFaults?.bearing_wear_severity > 0 ? 0.0 : 0.85),
    },
    {
      id: 'wastegate',
      label: 'Wastegate leak',
      effect: 'Boost deficit at altitude',
      active: Boolean(activeFaults?.turbo_wastegate_leak),
      toggle: () => onInjectFault('turbo_wastegate_leak', !activeFaults?.turbo_wastegate_leak),
    },
  ];

  const activeCount = faults.filter((f) => f.active).length;

  return (
    <section className="card p-4 flex flex-col">
      <div className="sec-head">
        <h2 className="sec-title">Simulation Console</h2>
        {activeCount > 0 && (
          <button onClick={onClearFaults} className="btn-quiet !text-crit !border-crit/30 hover:!bg-crit-dim">
            <RotateCcw className="w-3 h-3" />
            Clear {activeCount} fault{activeCount === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {/* Mission regime */}
      <div className="mb-4">
        <span className="label block mb-2">Mission regime</span>
        <div className="grid grid-cols-2 gap-2">
          {PROFILES.map((p) => {
            const active = currentProfile === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onSelectProfile(p.key)}
                className={`text-left px-3 py-2 rounded border transition-colors ${
                  active
                    ? 'bg-steel-500/15 border-steel-500/50'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {active && <span className="w-1 h-1 rounded-full bg-steel-300" />}
                  <span className={`font-cond font-semibold text-[13px] ${active ? 'text-steel-200' : 'text-zinc-300'}`}>
                    {p.label}
                  </span>
                </div>
                <span className="font-mono text-2xs text-zinc-600 block mt-0.5">{p.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fault injection */}
      <div className="mb-4">
        <span className="label block mb-2">Fault injection</span>
        <div className="row-div">
          {faults.map((f) => (
            <button
              key={f.id}
              onClick={f.toggle}
              className="w-full flex items-center justify-between gap-3 py-2 px-1 text-left group hover:bg-white/[0.025] transition-colors rounded"
            >
              <div className="min-w-0">
                <span className={`text-xs block ${f.active ? 'text-crit font-medium' : 'text-zinc-300'}`}>
                  {f.label}
                </span>
                <span className="font-mono text-2xs text-zinc-600">{f.effect}</span>
              </div>

              {/* switch */}
              <span
                className={`relative w-8 h-[18px] rounded-full flex-shrink-0 transition-colors ${
                  f.active ? 'bg-crit/70' : 'bg-white/[0.10] group-hover:bg-white/[0.16]'
                }`}
              >
                <span
                  className={`absolute top-[3px] w-3 h-3 rounded-full bg-zinc-100 transition-all ${
                    f.active ? 'left-[17px]' : 'left-[3px]'
                  }`}
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Replay */}
      <div className="mt-auto pt-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="label">Flight data recorder</span>
          <span className={`font-mono text-2xs uppercase tracking-[0.1em] ${isReplaying ? 'text-steel-300' : 'text-zinc-600'}`}>
            {isReplaying ? 'Playback' : 'Standby'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSortie}
            onChange={(e) => setSelectedSortie(e.target.value)}
            className="input flex-1 min-w-0"
          >
            <option value="SORTIE_TAPAS_07_NOMINAL">Sortie #104 — nominal ISR loiter (Pokhran)</option>
            <option value="SORTIE_TAPAS_08_MISFIRE">Sortie #108 — Cyl #3 ignition misfire</option>
          </select>

          {!isReplaying ? (
            <button onClick={() => onReplayControl({ action: 'start', sortie_id: selectedSortie })} className="btn-accent flex-shrink-0">
              <Play className="w-3 h-3 fill-current" />
              Replay
            </button>
          ) : (
            <button onClick={() => onReplayControl({ action: 'stop' })} className="btn-quiet flex-shrink-0">
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
