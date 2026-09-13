import React from 'react';
import { Thermometer, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function ThermalSpreadChart({ telemetry }) {
  const cht = telemetry?.cht || [118.0, 119.5, 117.8, 120.2];
  const egt = telemetry?.egt || [780.0, 785.0, 778.0, 790.0];

  const maxCht = Math.max(...cht);
  const minCht = Math.min(...cht);
  const deltaCht = maxCht - minCht;

  const maxEgt = Math.max(...egt);
  const minEgt = Math.min(...egt);
  const deltaEgt = maxEgt - minEgt;

  const isEgtAnomaly = deltaEgt > 120.0;
  const isChtAnomaly = deltaCht > 20.0 || maxCht > 138.0;

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Title & Delta Badges */}
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80 mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100">
            Multi-Cylinder Thermal Parity
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-code">
          <span className={`px-2 py-0.5 rounded border ${isChtAnomaly ? 'bg-red-500/20 text-red-300 border-red-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            ΔCHT: {deltaCht.toFixed(1)}°C
          </span>
          <span className={`px-2 py-0.5 rounded border ${isEgtAnomaly ? 'bg-red-500/20 text-red-300 border-red-500 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            ΔEGT: {deltaEgt.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* CHT Bar Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs font-mono-code text-slate-400 mb-2">
          <span>CYLINDER HEAD TEMPERATURES (CHT)</span>
          <span className="text-[11px] text-slate-500">REDLINE: 145°C</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {cht.map((val, idx) => {
            const pct = Math.min(100, (val / 160) * 100);
            const isHot = val > 138;
            const isCold = val < 90;
            return (
              <div key={idx} className="bg-tactical-950/70 border border-slate-800 rounded p-2 flex flex-col items-center">
                <span className="text-[10px] font-mono-code text-slate-400 mb-1">CYL #{idx + 1}</span>
                <div className="w-full bg-slate-800 h-16 rounded overflow-hidden flex flex-col justify-end p-0.5 relative">
                  <div 
                    className={`w-full rounded-sm transition-all duration-300 ${isHot ? 'bg-red-500 shadow-lg shadow-red-900' : (isCold ? 'bg-blue-600' : 'bg-emerald-500')}`}
                    style={{ height: `${pct}%` }}
                  />
                  {/* Warning line at 138°C */}
                  <div className="absolute top-[14%] inset-x-0 border-t border-red-500/40 border-dashed" />
                </div>
                <span className={`text-xs font-bold font-mono-code mt-1.5 ${isHot ? 'text-red-400' : (isCold ? 'text-blue-400' : 'text-slate-100')}`}>
                  {val.toFixed(1)}°C
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EGT Bar Section */}
      <div>
        <div className="flex justify-between items-center text-xs font-mono-code text-slate-400 mb-2">
          <span>EXHAUST GAS TEMPERATURES (EGT)</span>
          <span className="text-[11px] text-slate-500">MAX: 880°C</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {egt.map((val, idx) => {
            const pct = Math.min(100, (val / 950) * 100);
            const isMisfire = val < 450;
            const isLean = val > 870;
            return (
              <div key={idx} className="bg-tactical-950/70 border border-slate-800 rounded p-2 flex flex-col items-center">
                <span className="text-[10px] font-mono-code text-slate-400 mb-1">CYL #{idx + 1}</span>
                <div className="w-full bg-slate-800 h-16 rounded overflow-hidden flex flex-col justify-end p-0.5 relative">
                  <div 
                    className={`w-full rounded-sm transition-all duration-300 ${isMisfire ? 'bg-blue-600' : (isLean ? 'bg-amber-500 shadow-lg shadow-amber-900' : 'bg-cyan-500')}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs font-bold font-mono-code mt-1.5 ${isMisfire ? 'text-blue-400' : (isLean ? 'text-amber-400' : 'text-slate-100')}`}>
                  {val.toFixed(0)}°C
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Diagnostic Footnote */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono-code flex items-center justify-between text-slate-400">
        <span className="flex items-center gap-1">
          {isEgtAnomaly ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {isEgtAnomaly ? 'High Asymmetric EGT Spread (Check Fuel Injector / Ignition)' : 'Optimal Multi-Cylinder Combustion Balance'}
        </span>
        <span className="text-slate-500">COOLANT: {telemetry?.coolant_temp_c || 85}°C</span>
      </div>
    </div>
  );
}
