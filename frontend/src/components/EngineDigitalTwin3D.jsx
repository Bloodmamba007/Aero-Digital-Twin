import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Wind, 
  Droplet, 
  Activity, 
  RotateCw, 
  Maximize2, 
  Info, 
  Layers,
  Thermometer,
  Zap,
  Gauge
} from 'lucide-react';

export default function EngineDigitalTwin3D({ telemetry, idealPhysics, aiDiagnostics }) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [crankAngle, setCrankAngle] = useState(0);
  const requestRef = useRef();
  
  // Real-time crankshaft animation based on live RPM
  const rpm = telemetry?.rpm || 4800;
  
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      // Convert RPM to degrees/sec (scaled for smooth browser rendering)
      const degPerSec = (rpm / 60) * 360 * 0.12; 
      setCrankAngle((prev) => (prev + degPerSec * delta) % 360);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [rpm]);

  const cht = telemetry?.cht || [118.0, 119.5, 117.8, 120.2];
  const egt = telemetry?.egt || [780.0, 785.0, 778.0, 790.0];
  const oilPressure = telemetry?.oil_pressure_kpa || 380;
  const oilTemp = telemetry?.oil_temp_c || 95;
  const turboRpm = telemetry?.turbo_rpm || 95000;
  const mapKpa = telemetry?.map_kpa || 101.3;

  // Thermal color mapper for cylinder heads
  const getThermalColor = (c) => {
    if (c < 90) return { fill: '#1e3a8a', stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', status: 'COLD/MISFIRE' };
    if (c <= 125) return { fill: '#064e3b', stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', status: 'NOMINAL' };
    if (c <= 138) return { fill: '#78350f', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', status: 'CAUTION' };
    return { fill: '#7f1d1d', stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)', status: 'OVERHEATING' };
  };

  // Piston stroke offsets based on boxer firing & crank kinematics
  const rad = (crankAngle * Math.PI) / 180;
  // Boxer 4-stroke firing sequence 1-4-3-2:
  // Cyl 1 & 2 are opposed; Cyl 3 & 4 are opposed
  const piston1_x = Math.cos(rad) * 16;
  const piston2_x = -Math.cos(rad) * 16;
  const piston3_x = Math.cos(rad + Math.PI) * 16;
  const piston4_x = -Math.cos(rad + Math.PI) * 16;

  // Firing spark flash conditions
  const isSpark1 = (crankAngle >= 0 && crankAngle < 25);
  const isSpark4 = (crankAngle >= 90 && crankAngle < 115);
  const isSpark3 = (crankAngle >= 180 && crankAngle < 205);
  const isSpark2 = (crankAngle >= 270 && crankAngle < 295);

  return (
    <div className="bg-tactical-900 border border-tactical-border rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-3 border-b border-tactical-border/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100 flex items-center gap-2">
            Interactive Digital Twin <span className="text-xs font-mono-code text-cyan-400">[2.5D BOXER KINEMATICS]</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-code text-slate-400">
          <span className="flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: `${Math.max(0.2, 60 / rpm)}s` }} />
            CRANK: {Math.round(crankAngle)}°
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-cyan-300">FIRING ORDER: 1 - 4 - 3 - 2</span>
        </div>
      </div>

      {/* Main SVG Animated Engine Visualization */}
      <div className="relative w-full h-[380px] sm:h-[440px] flex items-center justify-center tactical-grid my-2 rounded-lg bg-tactical-950/90 border border-slate-800/60 overflow-hidden">
        
        {/* Radar Scanline Effect */}
        <div className="absolute inset-x-0 h-2 bg-gradient-to-b from-cyan-400/20 to-transparent pointer-events-none animate-scanline" />

        <svg viewBox="0 0 900 600" className="w-full h-full max-h-[440px] select-none">
          <defs>
            {/* Gradients */}
            <linearGradient id="crankcaseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id="pistonGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="turboGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ================= BACKGROUND AIR & EXHAUST MANIFOLD ================= */}
          {/* Exhaust Header Piping Left */}
          <path d="M 230 220 L 160 220 L 160 480 L 410 480" fill="none" stroke="#78350f" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          <path d="M 230 380 L 160 380" fill="none" stroke="#78350f" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          
          {/* Exhaust Header Piping Right */}
          <path d="M 670 220 L 740 220 L 740 480 L 490 480" fill="none" stroke="#78350f" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          <path d="M 670 380 L 740 380" fill="none" stroke="#78350f" strokeWidth="12" strokeLinecap="round" opacity="0.7" />

          {/* Exhaust Collector pipe to Turbo */}
          <path d="M 450 480 L 450 540" fill="none" stroke="#b45309" strokeWidth="16" strokeLinecap="round" />

          {/* Intercooler Charge Air Duct (Top) */}
          <path d="M 450 70 L 450 140 L 320 140 L 320 170" fill="none" stroke="#0284c7" strokeWidth="10" strokeDasharray="8,6" opacity="0.8" />
          <path d="M 450 140 L 580 140 L 580 170" fill="none" stroke="#0284c7" strokeWidth="10" strokeDasharray="8,6" opacity="0.8" />

          {/* ================= CRANKCASE (CENTRAL BLOCK) ================= */}
          <rect 
            x="340" y="160" width="220" height="280" rx="16" 
            fill="url(#crankcaseGrad)" 
            stroke="#334155" 
            strokeWidth="4" 
            className="cursor-pointer hover:stroke-cyan-500 transition-colors"
            onClick={() => setSelectedPart({ name: "Crankcase & Lubrication Sump", detail: `Oil Pressure: ${oilPressure} kPa | Temp: ${oilTemp}°C | Bearing Vibration: ${telemetry?.vibration_rms_g} G` })}
          />
          <text x="450" y="195" fill="#64748b" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace">
            CRANKCASE / DRY SUMP
          </text>

          {/* Crankshaft Center Gear & Rotation Indicator */}
          <circle cx="450" cy="300" r="48" fill="#1e293b" stroke="#475569" strokeWidth="4" />
          <circle cx="450" cy="300" r="18" fill="#334155" />
          
          {/* Rotating Crankshaft Web */}
          <g transform={`rotate(${crankAngle}, 450, 300)`}>
            <rect x="444" y="260" width="12" height="80" rx="6" fill="#cbd5e1" stroke="#475569" />
            <circle cx="450" cy="265" r="8" fill="#06b6d4" />
            <circle cx="450" cy="335" r="8" fill="#06b6d4" />
          </g>

          {/* ================= CYLINDER 1 (FRONT LEFT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[0]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #1 (Front Left)", cht: cht[0], egt: egt[0], spark: isSpark1, pwr: "25.0%" })}>
                {/* Cylinder Barrel */}
                <rect 
                  x="210" y="180" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {/* Cooling Fins */}
                {[195, 210, 225, 240].map((y) => (
                  <line key={y} x1="200" y1={y} x2="340" y2={y} stroke="#334155" strokeWidth="2.5" />
                ))}
                {/* Cylinder Head */}
                <rect x="180" y="180" width="30" height="80" rx="4" fill="#0f172a" stroke={therm.stroke} strokeWidth="3" />
                
                {/* Reciprocating Piston 1 */}
                <rect x={240 + piston1_x} y="195" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="2" />
                {/* Connecting Rod */}
                <line x1={290 + piston1_x} y1="220" x2="444" y2="280" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                {/* Spark Plug & Flame Ignition */}
                <circle cx="178" cy="220" r="5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                {isSpark1 && (
                  <circle cx="195" cy="220" r="22" fill="url(#sparkGlow)" className="animate-ping" />
                )}

                <text x="275" y="275" fill="#e2e8f0" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  CYL #1
                </text>
                <text x="275" y="290" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {cht[0]}°C | {egt[0]}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 2 (FRONT RIGHT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[1]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #2 (Front Right)", cht: cht[1], egt: egt[1], spark: isSpark2, pwr: "25.0%" })}>
                <rect 
                  x="560" y="180" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[195, 210, 225, 240].map((y) => (
                  <line key={y} x1="560" y1={y} x2="700" y2={y} stroke="#334155" strokeWidth="2.5" />
                ))}
                <rect x="690" y="180" width="30" height="80" rx="4" fill="#0f172a" stroke={therm.stroke} strokeWidth="3" />

                <rect x={610 + piston2_x} y="195" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="2" />
                <line x1={610 + piston2_x} y1="220" x2="456" y2="280" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                <circle cx="722" cy="220" r="5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                {isSpark2 && (
                  <circle cx="705" cy="220" r="22" fill="url(#sparkGlow)" className="animate-ping" />
                )}

                <text x="625" y="275" fill="#e2e8f0" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  CYL #2
                </text>
                <text x="625" y="290" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {cht[1]}°C | {egt[1]}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 3 (REAR LEFT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[2]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #3 (Rear Left)", cht: cht[2], egt: egt[2], spark: isSpark3, pwr: "25.0%" })}>
                <rect 
                  x="210" y="340" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[355, 370, 385, 400].map((y) => (
                  <line key={y} x1="200" y1={y} x2="340" y2={y} stroke="#334155" strokeWidth="2.5" />
                ))}
                <rect x="180" y="340" width="30" height="80" rx="4" fill="#0f172a" stroke={therm.stroke} strokeWidth="3" />

                <rect x={240 + piston3_x} y="355" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="2" />
                <line x1={290 + piston3_x} y1="380" x2="444" y2="320" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                <circle cx="178" cy="380" r="5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                {isSpark3 && (
                  <circle cx="195" cy="380" r="22" fill="url(#sparkGlow)" className="animate-ping" />
                )}

                <text x="275" y="435" fill="#e2e8f0" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  CYL #3
                </text>
                <text x="275" y="450" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {cht[2]}°C | {egt[2]}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 4 (REAR RIGHT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[3]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #4 (Rear Right)", cht: cht[3], egt: egt[3], spark: isSpark4, pwr: "25.0%" })}>
                <rect 
                  x="560" y="340" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[355, 370, 385, 400].map((y) => (
                  <line key={y} x1="560" y1={y} x2="700" y2={y} stroke="#334155" strokeWidth="2.5" />
                ))}
                <rect x="690" y="340" width="30" height="80" rx="4" fill="#0f172a" stroke={therm.stroke} strokeWidth="3" />

                <rect x={610 + piston4_x} y="355" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="2" />
                <line x1={610 + piston4_x} y1="380" x2="456" y2="320" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                <circle cx="722" cy="380" r="5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                {isSpark4 && (
                  <circle cx="705" cy="380" r="22" fill="url(#sparkGlow)" className="animate-ping" />
                )}

                <text x="625" y="435" fill="#e2e8f0" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  CYL #4
                </text>
                <text x="625" y="450" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {cht[3]}°C | {egt[3]}°C
                </text>
              </g>
            );
          })()}

          {/* ================= TURBOCHARGER HOUSING (TOP) ================= */}
          <g 
            className="cursor-pointer group" 
            onClick={() => setSelectedPart({ 
              name: "Turbocharger & Wastegate", 
              rpm: `${turboRpm.toLocaleString()} RPM`, 
              map: `${mapKpa} kPa (${(mapKpa * 0.2953).toFixed(1)} inHg)`,
              boost_ratio: (mapKpa / 101.3).toFixed(2) + "x"
            })}
          >
            {/* Turbo Housing */}
            <circle cx="450" cy="70" r="45" fill="url(#turboGrad)" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="450" cy="70" r="30" fill="#0c4a6e" />
            
            {/* Spinning Impeller Blades */}
            <g transform={`rotate(${crankAngle * 4}, 450, 70)`}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                <line 
                  key={ang} 
                  x1="450" y1="70" 
                  x2={450 + 26 * Math.cos((ang * Math.PI) / 180)} 
                  y2={70 + 26 * Math.sin((ang * Math.PI) / 180)} 
                  stroke="#e0f2fe" 
                  strokeWidth="3.5" 
                />
              ))}
            </g>

            {/* Wastegate Actuator Canister */}
            <rect x="500" y="55" width="40" height="28" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <line x1="495" y1="69" x2="500" y2="69" stroke="#94a3b8" strokeWidth="3" />

            <text x="450" y="25" fill="#38bdf8" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="monospace">
              TURBOCHARGER [{Math.round(turboRpm / 1000)}k RPM]
            </text>
            <text x="450" y="125" fill="#94a3b8" textAnchor="middle" fontSize="10" fontFamily="monospace">
              MAP: {mapKpa} kPa ({(mapKpa * 0.2953).toFixed(1)} inHg)
            </text>
          </g>

          {/* ================= OIL PUMP & DRY SUMP LINE (BOTTOM) ================= */}
          <g 
            className="cursor-pointer"
            onClick={() => setSelectedPart({ 
              name: "Dry Sump Lubrication Circuit", 
              pressure: `${oilPressure} kPa (${(oilPressure * 0.145).toFixed(1)} PSI)`, 
              temp: `${oilTemp}°C`,
              state: oilPressure < 220 ? "DANGER: CAVITATION / DROP" : "NOMINAL"
            })}
          >
            {/* Sump Pan */}
            <path d="M 370 440 L 530 440 L 510 470 L 390 470 Z" fill="#1e293b" stroke="#334155" strokeWidth="3" />
            {/* Oil Feed Line with Flow Indicators */}
            <path d="M 450 470 L 450 510 L 330 510" fill="none" stroke={oilPressure < 220 ? '#ef4444' : '#10b981'} strokeWidth="6" strokeDasharray="6,4" />
            <circle cx="320" cy="510" r="14" fill="#0f172a" stroke={oilPressure < 220 ? '#ef4444' : '#10b981'} strokeWidth="3" />
            <Droplet className="w-4 h-4" />
            <text x="450" y="535" fill={oilPressure < 220 ? '#ef4444' : '#10b981'} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace">
              OIL: {oilPressure} kPa | {oilTemp}°C
            </text>
          </g>
        </svg>

        {/* Selected Component Inspection Overlay Modal */}
        {selectedPart && (
          <div className="absolute top-3 left-3 bg-tactical-950/95 border border-cyan-500/60 rounded-lg p-3 shadow-2xl backdrop-blur max-w-xs text-xs font-mono-code z-20 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-cyan-300">{selectedPart.name}</span>
              <button onClick={() => setSelectedPart(null)} className="text-slate-400 hover:text-white px-1 font-bold">×</button>
            </div>
            <div className="mt-2 space-y-1 text-slate-300">
              {Object.entries(selectedPart).map(([k, v]) => {
                if (k === 'name') return null;
                return (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-slate-500 uppercase">{k.replace('_', ' ')}:</span>
                    <span className="font-semibold text-slate-100">{String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Legend */}
        <div className="absolute bottom-2 right-2 bg-tactical-950/80 border border-slate-800/80 rounded px-2.5 py-1.5 flex items-center gap-3 text-[10px] font-mono-code text-slate-400 backdrop-blur">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> NOMINAL (100-125°C)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> CAUTION (125-138°C)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500" /> REDLINE (&gt;138°C)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600" /> MISFIRE (&lt;90°C)</span>
        </div>
      </div>
    </div>
  );
}
