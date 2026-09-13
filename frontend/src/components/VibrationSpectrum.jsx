import React from 'react';
import { Activity, AlertTriangle, Radio, BarChart3 } from 'lucide-react';

export default function VibrationSpectrum({ telemetry }) {
  const rmsG = telemetry?.vibration_rms_g || 1.25;
  const spectrum = telemetry?.vibration_spectrum || {
    harmonic_1x_g: 0.55,
    harmonic_2x_g: 0.35,
    high_freq_turb_g: 0.85,
    spectral_bins: Array(32).fill(0.1)
  };

  const bins = spectrum.spectral_bins || [];
  const maxBin = Math.max(0.1, ...bins);
  const isHighVib = rmsG > 3.0;

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Title & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100">
            Vibration FFT & Harmonic Spectrum
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono-code text-xs">
          <span className="text-slate-400">RMS ACCEL:</span>
          <span className={`px-2 py-0.5 rounded font-bold border ${isHighVib ? 'bg-red-500/20 text-red-300 border-red-500 animate-pulse' : 'bg-slate-800 text-cyan-300 border-slate-700'}`}>
            {rmsG.toFixed(2)} G
          </span>
        </div>
      </div>

      {/* FFT Waterfall / Spectral Bins Visualizer */}
      <div className="bg-tactical-950/80 border border-slate-800 rounded-lg p-3 my-1">
        <div className="flex justify-between items-center text-[10px] font-mono-code text-slate-500 mb-2">
          <span>0 Hz (DC)</span>
          <span>500 Hz [1X / 2X CRANK]</span>
          <span>1000 Hz</span>
          <span>2000 Hz [TURBO]</span>
        </div>

        {/* Dynamic Spectrum Bar Graph */}
        <div className="h-28 flex items-end gap-1 w-full pt-2">
          {bins.map((val, idx) => {
            const heightPct = Math.min(100, (val / Math.max(2.5, maxBin)) * 100);
            const freqHz = idx * 62.5;
            const is1X = Math.abs(freqHz - (telemetry?.rpm || 4800) / 60) < 40;
            const isTurbo = freqHz > 1400;

            let barColor = 'bg-cyan-500/70 hover:bg-cyan-400';
            if (is1X) barColor = 'bg-amber-400 shadow-md shadow-amber-900';
            if (isTurbo && val > 1.0) barColor = 'bg-red-500 shadow-md shadow-red-900';

            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                title={`${freqHz.toFixed(0)} Hz: ${val.toFixed(3)} G`}
              >
                <div 
                  className={`w-full rounded-t-sm transition-all duration-150 ${barColor}`} 
                  style={{ height: `${Math.max(4, heightPct)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Frequency Axis Marker Line */}
        <div className="border-t border-slate-800 mt-1 flex justify-between text-[9px] font-mono-code text-slate-600 pt-1">
          <span>BIN 0</span>
          <span>1X: {((telemetry?.rpm || 4800) / 60).toFixed(0)} Hz</span>
          <span>2X: {(((telemetry?.rpm || 4800) / 60) * 2).toFixed(0)} Hz</span>
          <span>32-BIN FFT</span>
        </div>
      </div>

      {/* Harmonic Order Metric Badges */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono-code">
        <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-center">
          <span className="text-[10px] text-slate-500 block">1X CRANK BALANCE</span>
          <span className={`font-bold ${spectrum.harmonic_1x_g > 1.2 ? 'text-amber-400' : 'text-slate-200'}`}>
            {spectrum.harmonic_1x_g?.toFixed(2)} G
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-center">
          <span className="text-[10px] text-slate-500 block">2X RECIPROCATING</span>
          <span className="font-bold text-slate-200">
            {spectrum.harmonic_2x_g?.toFixed(2)} G
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-center">
          <span className="text-[10px] text-slate-500 block">TURBO SHAFT MESH</span>
          <span className={`font-bold ${spectrum.high_freq_turb_g > 1.5 ? 'text-red-400' : 'text-slate-200'}`}>
            {spectrum.high_freq_turb_g?.toFixed(2)} G
          </span>
        </div>
      </div>
    </div>
  );
}
