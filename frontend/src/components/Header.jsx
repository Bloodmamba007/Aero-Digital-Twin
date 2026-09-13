import React from 'react';
import { 
  Shield, 
  Activity, 
  Radio, 
  AlertTriangle, 
  RotateCcw, 
  FileText, 
  Cpu, 
  Gauge, 
  Plane,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

export default function Header({ 
  telemetry, 
  isConnected, 
  aiDiagnostics, 
  onOpenReport, 
  onOpenPhysics,
  onClearFaults,
  isReplaying
}) {
  const severity = aiDiagnostics?.severity || 'NOMINAL';
  
  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 border-red-500 text-red-400 glow-red animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 border-amber-500 text-amber-400 glow-amber';
      case 'CAUTION':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      default:
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 glow-green';
    }
  };

  return (
    <header className="bg-tactical-900 border-b border-tactical-border px-4 py-2.5 shadow-xl relative z-30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: DRDO / IDEX Emblem & Aircraft Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-900 border border-cyan-400/40 shadow-lg shadow-cyan-950">
            <Shield className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wider text-slate-100 flex items-center gap-1.5">
                DRDO <span className="text-cyan-400">AERO-TWIN</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                IDEX / DDP
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300 border border-slate-700">
                MALE UAV
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
              <span className="text-cyan-400 font-semibold">TAIL: UAV-TAPAS-07</span>
              <span>•</span>
              <span>BOXER-4C TURBO 141HP</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                {isConnected ? 'CAN-TELEMETRY SYNC' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mission & Environmental Status Banner */}
        <div className="hidden lg:flex items-center gap-4 bg-tactical-950/80 px-4 py-1.5 rounded-lg border border-slate-800/80 font-mono-code text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">ALT:</span>
            <span className="font-bold text-cyan-300">
              {telemetry?.altitude_ft?.toLocaleString() || '15,000'} FT
            </span>
            <span className="text-[10px] text-slate-400">({telemetry?.altitude_m?.toFixed(0) || '4572'} m)</span>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-500">IAS:</span>
            <span className="font-bold text-blue-300">{telemetry?.airspeed_kts || '85'} KTS</span>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500">OAT:</span>
            <span className="font-bold text-amber-300">{telemetry?.oat_c ?? '-15'}°C</span>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">MISSION:</span>
            <span className="font-bold text-emerald-400">
              {telemetry?.mission_profile?.replace('_', ' ') || 'ISR LOITER'}
            </span>
            {isReplaying && (
              <span className="ml-1 px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/50 animate-pulse">
                REPLAY ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Right: Airworthiness Status & Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Severity Status Badge */}
          <div className={`px-3 py-1 rounded-md border text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 ${getSeverityBadge()}`}>
            {severity === 'CRITICAL' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : severity === 'WARNING' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>AIRWORTHINESS: {severity}</span>
          </div>

          {/* Physics Model Inspector */}
          <button
            onClick={onOpenPhysics}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono-code text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1.5"
            title="Thermodynamic Physics Model vs Real Engine Residuals"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Physics Twin</span>
          </button>

          {/* Reset / Clear Faults Button */}
          <button
            onClick={onClearFaults}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono-code text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            title="Reset All Injected Faults to Nominal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Reset Twin</span>
          </button>

          {/* Generate Airworthiness Report */}
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-tactical-950 font-display font-bold text-xs shadow-md shadow-cyan-950 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Health Report</span>
          </button>
        </div>

      </div>
    </header>
  );
}
