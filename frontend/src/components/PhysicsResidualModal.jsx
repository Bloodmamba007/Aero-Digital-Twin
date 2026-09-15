import React from 'react';
import { Cpu, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="modal-shell max-w-2xl">

        {/* Header */}
        <div className="modal-head">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-steel-500/15 border border-steel-500/30 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 text-steel-400" />
            </div>
            <div>
              <h3 className="font-cond font-bold text-base text-zinc-100 tracking-wide">
                Physics-Informed Digital Twin Diagnostics
              </h3>
              <span className="text-xs font-mono text-steel-400">
                FIRST-PRINCIPLES THERMODYNAMICS VS ACTUAL SENSORS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-zinc-200 text-xs space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Explanation Box */}
          <div className="tile !bg-steel-500/[0.06] text-steel-200/90 leading-relaxed text-[11px]">
            <span className="font-semibold block mb-1 text-steel-300 font-cond tracking-wide">Hybrid Digital Twin Architecture</span>
            A real-time thermodynamic Zero-D Mean Value Engine Model (MVEM) runs continuously in parallel with onboard telemetry.
            By subtracting theoretical predictions from sensor measurements, the system calculates <strong>physics residuals</strong>.
            This eliminates environmental confounders (such as altitude air thinning and hot weather) and pinpoints true mechanical degradation.
          </div>

          {/* Physics Residual Matrix Table */}
          <div className="rounded border border-white/[0.07] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.06] font-semibold text-zinc-400 flex justify-between text-[11px] uppercase tracking-wide font-mono">
              <span>Channel</span>
              <span>Measured</span>
              <span>Physics Model</span>
              <span>Residual (Δ)</span>
            </div>

            <div className="divide-y divide-white/[0.05] font-mono">
              {/* CHT 1-4 */}
              {[0, 1, 2, 3].map((i) => {
                const res = residuals.cht_residuals_c?.[i] || 0.0;
                const isHigh = Math.abs(res) > 15.0;
                return (
                  <div key={i} className="px-3 py-2 flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">CYL #{i + 1} CHT</span>
                    <span>{telemetry?.cht?.[i]}°C</span>
                    <span className="text-zinc-500">{idealPhysics?.cht?.[i]}°C</span>
                    <span className={`font-semibold ${isHigh ? 'text-crit' : 'text-ok'}`}>
                      {res > 0 ? `+${res}` : res}°C
                    </span>
                  </div>
                );
              })}

              {/* EGT 1-4 — the largest divergence under a misfire, so it belongs here */}
              {[0, 1, 2, 3].map((i) => {
                const res = residuals.egt_residuals_c?.[i] || 0.0;
                const isHigh = Math.abs(res) > 100.0;
                return (
                  <div key={`egt${i}`} className="px-3 py-2 flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">CYL #{i + 1} EGT</span>
                    <span>{telemetry?.egt?.[i]}°C</span>
                    <span className="text-zinc-500">{idealPhysics?.egt?.[i]}°C</span>
                    <span className={`font-semibold ${isHigh ? 'text-crit' : 'text-ok'}`}>
                      {res > 0 ? `+${res}` : res}°C
                    </span>
                  </div>
                );
              })}

              {/* MAP */}
              <div className="px-3 py-2 flex justify-between items-center text-zinc-300">
                <span className="text-zinc-400">Manifold Pressure</span>
                <span>{telemetry?.map_kpa} kPa</span>
                <span className="text-zinc-500">{idealPhysics?.map_kpa} kPa</span>
                <span className={`font-semibold ${Math.abs(residuals.map_residual_kpa) > 10 ? 'text-warn' : 'text-ok'}`}>
                  {residuals.map_residual_kpa > 0 ? `+${residuals.map_residual_kpa}` : residuals.map_residual_kpa} kPa
                </span>
              </div>

              {/* Oil Pressure */}
              <div className="px-3 py-2 flex justify-between items-center text-zinc-300">
                <span className="text-zinc-400">Oil Pressure</span>
                <span>{telemetry?.oil_pressure_kpa} kPa</span>
                <span className="text-zinc-500">{idealPhysics?.oil_pressure_kpa} kPa</span>
                <span className={`font-semibold ${residuals.oil_pressure_residual_kpa < -50 ? 'text-crit' : 'text-ok'}`}>
                  {residuals.oil_pressure_residual_kpa} kPa
                </span>
              </div>

              {/* Oil temperature */}
              <div className="px-3 py-2 flex justify-between items-center text-zinc-300">
                <span className="text-zinc-400">Oil Temperature</span>
                <span>{telemetry?.oil_temp_c}°C</span>
                <span className="text-zinc-500">{idealPhysics?.oil_temp_c}°C</span>
                <span className={`font-semibold ${Math.abs(residuals.oil_temp_residual_c) > 10 ? 'text-warn' : 'text-ok'}`}>
                  {residuals.oil_temp_residual_c > 0 ? `+${residuals.oil_temp_residual_c}` : residuals.oil_temp_residual_c}°C
                </span>
              </div>

              {/* Vibration */}
              <div className="px-3 py-2 flex justify-between items-center text-zinc-300">
                <span className="text-zinc-400">Vibration RMS</span>
                <span>{telemetry?.vibration_rms_g} G</span>
                <span className="text-zinc-500">{idealPhysics?.vibration_rms_g} G</span>
                <span className={`font-semibold ${residuals.vibration_residual_g > 1.0 ? 'text-warn' : 'text-ok'}`}>
                  +{residuals.vibration_residual_g} G
                </span>
              </div>
            </div>
          </div>

          {/* Model Specification Card */}
          <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-400 tile">
            <div>
              <span className="text-zinc-500 block mb-0.5">Atmospheric Formulation</span>
              <span className="text-zinc-200">ISA Barometric Lapse (0-11,000m)</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">Combustion Cycle</span>
              <span className="text-zinc-200">4-Stroke Otto (Compression Ratio 8.2:1)</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">Air Density Correction</span>
              <span className="text-zinc-200 font-mono">σ = {telemetry?.density_ratio_sigma || '0.742'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">Turbocharger Boost</span>
              <span className="text-zinc-200">Dynamic Wastegate Controller (+0.45 Bar)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
