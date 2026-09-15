import React, { useState, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';

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

  // Cylinders are coloured by deviation from the pack median, not by absolute
  // temperature: at 15,000 ft a healthy engine cruises near 87 °C, which any fixed
  // low-temperature threshold would report as four simultaneous misfires. The
  // median rather than the mean, so one dead cylinder cannot drag the reference
  // far enough to flag the three healthy ones.
  const chtMedian = (() => {
    const s = [...cht].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  })();

  const getThermalColor = (c) => {
    const dev = c - chtMedian;
    if (c > 138) return { fill: '#3a1f22', stroke: '#d96b6b', glow: 'rgba(217,107,107,0.45)', status: 'OVER TEMP' };
    if (dev < -15) return { fill: '#1d2739', stroke: '#6b93d9', glow: 'rgba(107,147,217,0.4)', status: 'COMBUSTION LOSS' };
    if (dev > 15) return { fill: '#3a2f1c', stroke: '#d9a441', glow: 'rgba(217,164,65,0.4)', status: 'RUNNING HOT' };
    return { fill: '#1b2a22', stroke: '#5fb87f', glow: 'rgba(95,184,127,0.28)', status: 'NOMINAL' };
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

  const severity = aiDiagnostics?.severity || 'NOMINAL';
  const isCritical = severity === 'CRITICAL';

  return (
    <div className={`card p-4 flex flex-col relative h-full ${isCritical ? 'border-crit/40' : ''}`}>
      <div className="sec-head">
        <div className="flex items-baseline gap-3">
          <h2 className="sec-title">Engine Schematic</h2>
          <span className="sec-note">Boxer-4C · live kinematics</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500">
            <RotateCw className="w-3 h-3 text-steel-400 animate-spin" style={{ animationDuration: `${Math.max(0.2, 60 / rpm)}s` }} />
            {Math.round(crankAngle)}°
          </span>
          <span className="sec-note hidden sm:inline">Firing 1-4-3-2</span>
        </div>
      </div>

      {/* Main SVG Animated Engine Visualization */}
      <div className="relative w-full flex-1 min-h-[400px] sm:min-h-[470px] flex items-center justify-center rounded bg-base-0 border border-white/[0.05] overflow-hidden bg-hairline">

        <svg viewBox="132 -14 636 586" className="w-full h-full select-none">
          <defs>
            {/* Gradients */}
            <linearGradient id="crankcaseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#24242b" />
              <stop offset="50%" stopColor="#17171c" />
              <stop offset="100%" stopColor="#0e0e12" />
            </linearGradient>

            <linearGradient id="pistonGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b8b95" />
              <stop offset="50%" stopColor="#c8c8d0" />
              <stop offset="100%" stopColor="#63636d" />
            </linearGradient>

            <linearGradient id="turboGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5b8db8" />
              <stop offset="100%" stopColor="#33556c" />
            </linearGradient>

            <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e8c06a" stopOpacity="1" />
              <stop offset="60%" stopColor="#d9a441" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d96b6b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ================= BACKGROUND AIR & EXHAUST MANIFOLD ================= */}
          {/* Exhaust Header Piping Left */}
          <path d="M 230 220 L 160 220 L 160 480 L 410 480" fill="none" stroke="#4a3520" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          <path d="M 230 380 L 160 380" fill="none" stroke="#4a3520" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          
          {/* Exhaust Header Piping Right */}
          <path d="M 670 220 L 740 220 L 740 480 L 490 480" fill="none" stroke="#4a3520" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          <path d="M 670 380 L 740 380" fill="none" stroke="#4a3520" strokeWidth="12" strokeLinecap="round" opacity="0.7" />

          {/* Exhaust Collector pipe to Turbo */}
          <path d="M 450 480 L 450 540" fill="none" stroke="#6b4a24" strokeWidth="16" strokeLinecap="round" />

          {/* Intercooler Charge Air Duct (Top) */}
          <path d="M 450 70 L 450 140 L 320 140 L 320 170" fill="none" stroke="#46728f" strokeWidth="10" strokeDasharray="8,6" opacity="0.8" />
          <path d="M 450 140 L 580 140 L 580 170" fill="none" stroke="#46728f" strokeWidth="10" strokeDasharray="8,6" opacity="0.8" />

          {/* ================= CRANKCASE (CENTRAL BLOCK) ================= */}
          <rect 
            x="340" y="160" width="220" height="280" rx="16" 
            fill="url(#crankcaseGrad)" 
            stroke="#2f2f38" 
            strokeWidth="4" 
            className="cursor-pointer hover:stroke-steel-400 transition-colors"
            onClick={() => setSelectedPart({ name: "Crankcase & Lubrication Sump", detail: `${oilPressure.toFixed(0)} kPa · ${oilTemp.toFixed(1)}°C · ${(telemetry?.vibration_rms_g ?? 0).toFixed(2)} G` })}
          />
          <text x="450" y="195" fill="#6a6a74" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
            CRANKCASE / DRY SUMP
          </text>

          {/* Crankshaft Center Gear & Rotation Indicator */}
          <circle cx="450" cy="300" r="48" fill="#1f1f26" stroke="#3d3d47" strokeWidth="4" />
          <circle cx="450" cy="300" r="18" fill="#2f2f38" />
          
          {/* Rotating Crankshaft Web */}
          <g transform={`rotate(${crankAngle}, 450, 300)`}>
            <rect x="444" y="260" width="12" height="80" rx="6" fill="#c8c8d0" stroke="#3d3d47" />
            <circle cx="450" cy="265" r="8" fill="#5b8db8" />
            <circle cx="450" cy="335" r="8" fill="#5b8db8" />
          </g>

          {/* ================= CYLINDER 1 (FRONT LEFT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[0]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #1 (Front Left)", cht: cht[0].toFixed(1), egt: egt[0].toFixed(0), spark: isSpark1, pwr: "25.0%" })}>
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
                  <line key={y} x1="200" y1={y} x2="340" y2={y} stroke="#2f2f38" strokeWidth="2.5" />
                ))}
                {/* Cylinder Head */}
                <rect x="180" y="180" width="30" height="80" rx="4" fill="#131316" stroke={therm.stroke} strokeWidth="3" />
                
                {/* Reciprocating Piston 1 */}
                <rect x={240 + piston1_x} y="195" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#3d3d47" strokeWidth="2" />
                {/* Connecting Rod */}
                <line x1={290 + piston1_x} y1="220" x2="444" y2="280" stroke="#8b8b95" strokeWidth="6" strokeLinecap="round" />

                {/* Spark Plug & Flame Ignition */}
                <circle cx="178" cy="220" r="5" fill="#d9a441" stroke="#e8c06a" strokeWidth="2" />
                {isSpark1 && (
                  <circle cx="195" cy="220" r="15" fill="url(#sparkGlow)" />
                )}

                <text x="275" y="281" fill="#d7d9dd" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  CYL #1
                </text>
                <text x="275" y="297" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  {cht[0].toFixed(1)}°C | {egt[0].toFixed(0)}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 2 (FRONT RIGHT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[1]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #2 (Front Right)", cht: cht[1].toFixed(1), egt: egt[1].toFixed(0), spark: isSpark2, pwr: "25.0%" })}>
                <rect 
                  x="560" y="180" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[195, 210, 225, 240].map((y) => (
                  <line key={y} x1="560" y1={y} x2="700" y2={y} stroke="#2f2f38" strokeWidth="2.5" />
                ))}
                <rect x="690" y="180" width="30" height="80" rx="4" fill="#131316" stroke={therm.stroke} strokeWidth="3" />

                <rect x={610 + piston2_x} y="195" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#3d3d47" strokeWidth="2" />
                <line x1={610 + piston2_x} y1="220" x2="456" y2="280" stroke="#8b8b95" strokeWidth="6" strokeLinecap="round" />

                <circle cx="722" cy="220" r="5" fill="#d9a441" stroke="#e8c06a" strokeWidth="2" />
                {isSpark2 && (
                  <circle cx="705" cy="220" r="15" fill="url(#sparkGlow)" />
                )}

                <text x="625" y="281" fill="#d7d9dd" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  CYL #2
                </text>
                <text x="625" y="297" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  {cht[1].toFixed(1)}°C | {egt[1].toFixed(0)}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 3 (REAR LEFT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[2]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #3 (Rear Left)", cht: cht[2].toFixed(1), egt: egt[2].toFixed(0), spark: isSpark3, pwr: "25.0%" })}>
                <rect 
                  x="210" y="340" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[355, 370, 385, 400].map((y) => (
                  <line key={y} x1="200" y1={y} x2="340" y2={y} stroke="#2f2f38" strokeWidth="2.5" />
                ))}
                <rect x="180" y="340" width="30" height="80" rx="4" fill="#131316" stroke={therm.stroke} strokeWidth="3" />

                <rect x={240 + piston3_x} y="355" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#3d3d47" strokeWidth="2" />
                <line x1={290 + piston3_x} y1="380" x2="444" y2="320" stroke="#8b8b95" strokeWidth="6" strokeLinecap="round" />

                <circle cx="178" cy="380" r="5" fill="#d9a441" stroke="#e8c06a" strokeWidth="2" />
                {isSpark3 && (
                  <circle cx="195" cy="380" r="15" fill="url(#sparkGlow)" />
                )}

                <text x="275" y="441" fill="#d7d9dd" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  CYL #3
                </text>
                <text x="275" y="457" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  {cht[2].toFixed(1)}°C | {egt[2].toFixed(0)}°C
                </text>
              </g>
            );
          })()}

          {/* ================= CYLINDER 4 (REAR RIGHT) ================= */}
          {(() => {
            const therm = getThermalColor(cht[3]);
            return (
              <g className="cursor-pointer group" onClick={() => setSelectedPart({ name: "Cylinder #4 (Rear Right)", cht: cht[3].toFixed(1), egt: egt[3].toFixed(0), spark: isSpark4, pwr: "25.0%" })}>
                <rect 
                  x="560" y="340" width="130" height="80" rx="8" 
                  fill={therm.fill} 
                  stroke={therm.stroke} 
                  strokeWidth="3.5"
                  style={{ filter: `drop-shadow(0 0 8px ${therm.glow})` }}
                />
                {[355, 370, 385, 400].map((y) => (
                  <line key={y} x1="560" y1={y} x2="700" y2={y} stroke="#2f2f38" strokeWidth="2.5" />
                ))}
                <rect x="690" y="340" width="30" height="80" rx="4" fill="#131316" stroke={therm.stroke} strokeWidth="3" />

                <rect x={610 + piston4_x} y="355" width="50" height="50" rx="4" fill="url(#pistonGrad)" stroke="#3d3d47" strokeWidth="2" />
                <line x1={610 + piston4_x} y1="380" x2="456" y2="320" stroke="#8b8b95" strokeWidth="6" strokeLinecap="round" />

                <circle cx="722" cy="380" r="5" fill="#d9a441" stroke="#e8c06a" strokeWidth="2" />
                {isSpark4 && (
                  <circle cx="705" cy="380" r="15" fill="url(#sparkGlow)" />
                )}

                <text x="625" y="441" fill="#d7d9dd" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  CYL #4
                </text>
                <text x="625" y="457" fill={therm.stroke} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono, monospace">
                  {cht[3].toFixed(1)}°C | {egt[3].toFixed(0)}°C
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
              map: `${mapKpa.toFixed(1)} kPa (${(mapKpa * 0.2953).toFixed(1)} inHg)`,
              boost_ratio: (mapKpa / 101.3).toFixed(2) + "x"
            })}
          >
            {/* Turbo Housing */}
            <circle cx="450" cy="70" r="45" fill="url(#turboGrad)" stroke="#7aa2c4" strokeWidth="3" />
            <circle cx="450" cy="70" r="30" fill="#1c2b36" />
            
            {/* Spinning Impeller Blades */}
            <g transform={`rotate(${crankAngle * 4}, 450, 70)`}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                <line 
                  key={ang} 
                  x1="450" y1="70" 
                  x2={450 + 26 * Math.cos((ang * Math.PI) / 180)} 
                  y2={70 + 26 * Math.sin((ang * Math.PI) / 180)} 
                  stroke="#c2d6e6" 
                  strokeWidth="3.5" 
                />
              ))}
            </g>

            {/* Wastegate Actuator Canister */}
            <rect x="500" y="55" width="40" height="28" rx="4" fill="#2f2f38" stroke="#63636d" strokeWidth="2" />
            <line x1="495" y1="69" x2="500" y2="69" stroke="#8b8b95" strokeWidth="3" />

            <text x="450" y="18" fill="#6a6a74" textAnchor="middle" fontSize="11" fontWeight="500" fontFamily="IBM Plex Mono, monospace">
              TURBOCHARGER
            </text>
          </g>

          {/* ================= OIL PUMP & DRY SUMP LINE (BOTTOM) ================= */}
          <g 
            className="cursor-pointer"
            onClick={() => setSelectedPart({ 
              name: "Dry Sump Lubrication Circuit", 
              pressure: `${oilPressure.toFixed(0)} kPa (${(oilPressure * 0.145).toFixed(1)} PSI)`, 
              temp: `${oilTemp.toFixed(1)}°C`,
              state: oilPressure < 220 ? "DANGER: CAVITATION / DROP" : "NOMINAL"
            })}
          >
            {/* Sump Pan */}
            <path d="M 370 440 L 530 440 L 510 470 L 390 470 Z" fill="#1f1f26" stroke="#2f2f38" strokeWidth="3" />
            {/* Oil Feed Line with Flow Indicators */}
            <path d="M 450 470 L 450 510 L 330 510" fill="none" stroke={oilPressure < 220 ? '#d96b6b' : '#5fb87f'} strokeWidth="6" strokeDasharray="6,4" />
            <circle cx="320" cy="510" r="14" fill="#131316" stroke={oilPressure < 220 ? '#d96b6b' : '#5fb87f'} strokeWidth="3" />
          </g>
        </svg>

        {/* Selected Component Inspection Overlay */}
        {selectedPart && (
          <div className="absolute top-3 left-3 card-lift p-3 max-w-xs text-xs z-20 animate-slide-up">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
              <span className="font-cond font-semibold text-[13px] text-zinc-100">{selectedPart.name}</span>
              <button onClick={() => setSelectedPart(null)} className="text-zinc-500 hover:text-zinc-100 px-1 leading-none">×</button>
            </div>
            <div className="space-y-1 text-zinc-300">
              {Object.entries(selectedPart).map(([k, v]) => {
                if (k === 'name') return null;
                return (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="label">{k.replace('_', ' ')}</span>
                    <span className="num text-[12px]">{String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key readouts live in HTML, not in the SVG: as text nodes they sat on top
            of the intake ducting and the oil line at some viewport widths. */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.1em] text-zinc-600 w-14">Boost</span>
            <span className="num text-[13px]">{mapKpa.toFixed(1)}<span className="unit">kPa</span></span>
            <span className="font-mono text-2xs text-zinc-600">{(mapKpa * 0.2953).toFixed(1)} inHg</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.1em] text-zinc-600 w-14">Turbo</span>
            <span className="num text-[13px]">{Math.round(turboRpm / 1000)}<span className="unit">k rpm</span></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.1em] text-zinc-600 w-14">Oil</span>
            <span className={`num text-[13px] ${oilPressure < 220 ? 'text-crit' : ''}`}>
              {oilPressure.toFixed(0)}<span className="unit">kPa</span>
            </span>
            <span className="font-mono text-2xs text-zinc-600">{oilTemp.toFixed(1)} °C</span>
          </div>
        </div>

        {/* Live Legend */}
        <div className="absolute bottom-2.5 right-2.5 bg-base-1/85 border border-white/[0.07] rounded px-2.5 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 backdrop-blur">
          <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-ok" /> in balance</span>
          <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-warn" /> hot</span>
          <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-cold" /> combustion loss</span>
          <span className="flex items-center gap-1.5 font-mono text-2xs text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-crit" /> over temp</span>
        </div>
      </div>
    </div>
  );
}
