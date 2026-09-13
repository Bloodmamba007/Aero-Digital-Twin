import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Flame, 
  Droplet, 
  Wind, 
  Radio, 
  Activity, 
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Compass
} from 'lucide-react';

export default function MissionControlPanel({ 
  currentProfile, 
  activeFaults, 
  onSelectProfile, 
  onInjectFault, 
  onClearFaults,
  replayState,
  onReplayControl
}) {
  const [selectedSortie, setSelectedSortie] = useState("SORTIE_TAPAS_08_MISFIRE");
  const [isReplaying, setIsReplaying] = useState(false);

  const profiles = [
    { key: "ISR_LOITER", label: "ISR Loiter", sub: "15,000 ft Cruise", desc: "Long-endurance surveillance at 74% power" },
    { key: "ALTITUDE_CLIMB", label: "Tactical Climb", sub: "0 to 22,000 ft", desc: "Aggressive climb with turbo boost" },
    { key: "DESERT_HEAT_SOAK", label: "Desert Heat", sub: "Thar +45°C", desc: "Low-level loiter under extreme thermal stress" },
    { key: "SNAP_THROTTLE", label: "Snap Throttle", sub: "Evasive Bursts", desc: "Rapid throttle transitions 35% -> 98%" }
  ];

  const handleStartReplay = (sortieId) => {
    setIsReplaying(true);
    onReplayControl({ action: "start", sortie_id: sortieId });
  };

  const handleStopReplay = () => {
    setIsReplaying(false);
    onReplayControl({ action: "stop" });
  };

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100">
            Mission Profiles & Fault Injector
          </h2>
        </div>
        <button
          onClick={onClearFaults}
          className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/80 text-[11px] font-mono-code text-emerald-300 flex items-center gap-1 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          CLEAR ALL FAULTS
        </button>
      </div>

      {/* 1. Operational Mission Profiles */}
      <div className="mb-4">
        <span className="text-xs font-mono-code text-slate-400 block mb-2">OPERATIONAL MISSION REGIME</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {profiles.map((p) => {
            const isActive = currentProfile === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onSelectProfile(p.key)}
                className={`p-2 rounded-lg border text-left font-mono-code transition-all ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                    : 'bg-tactical-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{p.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <span className="text-[10px] text-cyan-400/80 block mt-0.5">{p.sub}</span>
                <span className="text-[9px] text-slate-500 block line-clamp-1 mt-1">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Fault Injection Deck */}
      <div className="mb-4">
        <span className="text-xs font-mono-code text-slate-400 block mb-2">IN-FLIGHT ANOMALY & FAULT INJECTION DECK</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono-code">
          
          {/* Misfire Cylinder 3 */}
          <button
            onClick={() => onInjectFault("misfire_cyl", activeFaults?.misfire_cyl === 3 ? null : 3)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.misfire_cyl === 3
                ? 'bg-red-950/60 border-red-500 text-red-300 shadow-md shadow-red-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">CYL #3 MISFIRE</span>
              <Flame className={`w-3.5 h-3.5 ${activeFaults?.misfire_cyl === 3 ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">EGT drop + torsional wobble</span>
          </button>

          {/* Clogged Fuel Injector (Lean Spike) */}
          <button
            onClick={() => onInjectFault("clogged_injector_cyl", activeFaults?.clogged_injector_cyl === 1 ? null : 1)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.clogged_injector_cyl === 1
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">INJECTOR #1 RESTRICTION</span>
              <AlertOctagon className={`w-3.5 h-3.5 ${activeFaults?.clogged_injector_cyl === 1 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Severe lean burn &gt;875°C</span>
          </button>

          {/* Cooling Degradation */}
          <button
            onClick={() => onInjectFault("cooling_degradation_factor", activeFaults?.cooling_degradation_factor < 0.8 ? 1.0 : 0.45)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.cooling_degradation_factor < 0.8
                ? 'bg-red-950/60 border-red-500 text-red-300 shadow-md shadow-red-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">RADIATOR CORE RESTRICTION</span>
              <Wind className={`w-3.5 h-3.5 ${activeFaults?.cooling_degradation_factor < 0.8 ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Cooling loss &gt;140°C CHT</span>
          </button>

          {/* Oil Pressure Leak */}
          <button
            onClick={() => onInjectFault("oil_leak_severity", activeFaults?.oil_leak_severity > 0 ? 0.0 : 0.75)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.oil_leak_severity > 0
                ? 'bg-red-950/60 border-red-500 text-red-300 shadow-md shadow-red-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">OIL SCAVENGE LINE LEAK</span>
              <Droplet className={`w-3.5 h-3.5 ${activeFaults?.oil_leak_severity > 0 ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Pressure drops below 190 kPa</span>
          </button>

          {/* Crankshaft Bearing Wear (Vibration) */}
          <button
            onClick={() => onInjectFault("bearing_wear_severity", activeFaults?.bearing_wear_severity > 0 ? 0.0 : 0.85)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.bearing_wear_severity > 0
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">BEARING DEGRADATION</span>
              <Activity className={`w-3.5 h-3.5 ${activeFaults?.bearing_wear_severity > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Harmonic vib spike &gt;3.5 G</span>
          </button>

          {/* Turbo Wastegate Leak */}
          <button
            onClick={() => onInjectFault("turbo_wastegate_leak", !activeFaults?.turbo_wastegate_leak)}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
              activeFaults?.turbo_wastegate_leak
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                : 'bg-tactical-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">TURBO WASTEGATE LEAK</span>
              <Wind className={`w-3.5 h-3.5 ${activeFaults?.turbo_wastegate_leak ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Boost deficit at high alt</span>
          </button>

        </div>
      </div>

      {/* 3. Mission Replay & Flight Data Recorder Controls */}
      <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs font-mono-code mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            HISTORICAL MISSION SORTIE REPLAY (FDR)
          </span>
          <span className="text-purple-400 font-semibold">
            {isReplaying ? 'PLAYBACK SYNCHRONIZED' : 'STANDBY'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={selectedSortie}
            onChange={(e) => setSelectedSortie(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono-code rounded px-2.5 py-1.5 outline-none focus:border-cyan-500"
          >
            <option value="SORTIE_TAPAS_07_NOMINAL">TAPAS Sortie #104 - Nominal ISR Loiter (Pokhran)</option>
            <option value="SORTIE_TAPAS_08_MISFIRE">TAPAS Sortie #108 - Cyl #3 Ignition Misfire Incident</option>
          </select>

          {!isReplaying ? (
            <button
              onClick={() => handleStartReplay(selectedSortie)}
              className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono-code text-xs flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Replay Sortie</span>
            </button>
          ) : (
            <button
              onClick={handleStopReplay}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500 font-mono-code text-xs flex items-center gap-1.5 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Replay</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
