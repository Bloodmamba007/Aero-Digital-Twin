import React from 'react';
import { Cpu, X, Layers, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PhysicsResidualModal({ isOpen, onClose, telemetry, idealPhysics, aiDiagnostics }) {
  if (!isOpen) return null;

  const residuals = aiDiagnostics?.physics_residuals || {
    cht_residuals_c: [0.0, 0.0, 0.0, 0.0],
    egt_residuals_c: [0.0, 0.0, 0.0, 0.0],
    map_residual_kpa: 0.0,
    oil_pressure_residual_kpa: 0.0,
    oil_temp_residual_c: 0.0,
    vibration_residual_g: 0.0
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-tactical-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="bg-tactical-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 uppercase tracking-wider">
                Physics-Informed Digital Twin Diagnostics
              </h3>
              <span className="text-xs font-mono-code text-cyan-400">
                FIRST-PRINCIPLES THERMODYNAMICS VS ACTUAL SENSORS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-slate-200 font-mono-code text-xs space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Explanation Box */}
          <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-lg p-3 text-cyan-200 leading-relaxed text-[11px]">
            <span className="font-bold block mb-1 text-cyan-300">HYBRID DIGITAL TWIN ARCHITECTURE:</span>
            A real-time thermodynamic Zero-D Mean Value Engine Model (MVEM) runs continuously in parallel with onboard telemetry.
            By subtracting theoretical predictions from sensor measurements, the system calculates <strong>physics residuals</strong>.
            This eliminates environmental confounders (such as altitude air thinning and hot weather) and pinpoints true mechanical degradation.
          </div>

          {/* Physics Residual Matrix Table */}
          <div className="bg-tactical-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-800 font-bold text-slate-300 flex justify-between">
              <span>TELEMETRY CHANNEL</span>
              <span>MEASURED</span>
              <span>PHYSICS MODEL</span>
              <span>RESIDUAL (Δ)</span>
            </div>
            
            <div className="divide-y divide-slate-800/60">
              {/* CHT 1-4 */}
              {[0, 1, 2, 3].map((i) => {
                const res = residuals.cht_residuals_c?.[i] || 0.0;
                const isHigh = Math.abs(res) > 15.0;
                return (
                  <div key={i} className="px-3 py-2 flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">CYL #{i + 1} CHT</span>
                    <span>{telemetry?.cht?.[i]}°C</span>
                    <span className="text-slate-500">{idealPhysics?.cht?.[i]}°C</span>
                    <span className={`font-bold ${isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                      {res > 0 ? `+${res}` : res}°C
                    </span>
                  </div>
                );
              })}

              {/* MAP */}
              <div className="px-3 py-2 flex justify-between items-center text-slate-300">
                <span className="text-slate-400">MANIFOLD PRESSURE (MAP)</span>
                <span>{telemetry?.map_kpa} kPa</span>
                <span className="text-slate-500">{idealPhysics?.map_kpa} kPa</span>
                <span className={`font-bold ${Math.abs(residuals.map_residual_kpa) > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {residuals.map_residual_kpa > 0 ? `+${residuals.map_residual_kpa}` : residuals.map_residual_kpa} kPa
                </span>
              </div>

              {/* Oil Pressure */}
              <div className="px-3 py-2 flex justify-between items-center text-slate-300">
                <span className="text-slate-400">OIL PRESSURE</span>
                <span>{telemetry?.oil_pressure_kpa} kPa</span>
                <span className="text-slate-500">{idealPhysics?.oil_pressure_kpa} kPa</span>
                <span className={`font-bold ${residuals.oil_pressure_residual_kpa < -50 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {residuals.oil_pressure_residual_kpa} kPa
                </span>
              </div>

              {/* Vibration */}
              <div className="px-3 py-2 flex justify-between items-center text-slate-300">
                <span className="text-slate-400">VIBRATION RMS</span>
                <span>{telemetry?.vibration_rms_g} G</span>
                <span className="text-slate-500">{idealPhysics?.vibration_rms_g} G</span>
                <span className={`font-bold ${residuals.vibration_residual_g > 1.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  +{residuals.vibration_residual_g} G
                </span>
              </div>
            </div>
          </div>

          {/* Model Specification Card */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block">ATMOSPHERIC FORMULATION</span>
              <span className="text-slate-200">ISA Barometric Lapse (0-11,000m)</span>
            </div>
            <div>
              <span className="text-slate-500 block">COMBUSTION CYCLE</span>
              <span className="text-slate-200">4-Stroke Otto (Compression Ratio 8.2:1)</span>
            </div>
            <div>
              <span className="text-slate-500 block">AIR DENSITY CORRECTION</span>
              <span className="text-slate-200">σ = {telemetry?.density_ratio_sigma || '0.742'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">TURBOCHARGER BOOST</span>
              <span className="text-slate-200">Dynamic Wastegate Controller (+0.45 Bar)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
