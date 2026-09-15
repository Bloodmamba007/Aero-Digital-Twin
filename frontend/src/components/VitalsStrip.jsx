import React from 'react';
import Sparkline from './Sparkline';

/** 240° arc gauge. Sweep is clamped so out-of-range data can't overdraw the track. */
function ArcGauge({ value, min = 0, max = 100, color = '#7aa2c4', size = 62 }) {
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const r = 26;
  const c = size / 2;
  const START = 150;
  const SWEEP = 240;

  const pt = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const arc = (fromDeg, toDeg) => {
    const [x1, y1] = pt(fromDeg);
    const [x2, y2] = pt(toDeg);
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  };

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <path d={arc(START, START + SWEEP)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
      {frac > 0.001 && (
        <path
          d={arc(START, START + SWEEP * frac)}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      )}
    </svg>
  );
}

function Vital({ label, value, unit, sub, trend, color = '#7aa2c4', gauge, alert }) {
  return (
    <div className={`px-4 py-3.5 flex flex-col justify-between gap-2 ${alert ? 'bg-crit-dim' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="label">{label}</span>
        {sub && <span className="font-mono text-2xs text-zinc-600 text-right leading-tight">{sub}</span>}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline">
            <span className="num-xl" style={alert ? { color: '#d96b6b' } : undefined}>{value}</span>
            <span className="unit">{unit}</span>
          </div>
          {trend && trend.length > 1 && (
            <div className="mt-2">
              <Sparkline data={trend} color={alert ? '#d96b6b' : color} width={104} height={24} />
            </div>
          )}
        </div>
        {gauge}
      </div>
    </div>
  );
}

export default function VitalsStrip({ telemetry, history }) {
  const rpm = telemetry?.rpm || 0;
  const mapKpa = telemetry?.map_kpa || 0;
  const oilP = telemetry?.oil_pressure_kpa || 0;
  const oilT = telemetry?.oil_temp_c || 0;
  const fuel = telemetry?.fuel_flow_lph || 0;
  const volts = telemetry?.bus_voltage_v || 0;
  const amps = telemetry?.alternator_current_a || 0;
  const bhp = telemetry?.brake_hp || 0;
  const throttle = telemetry?.throttle_pct || 0;
  const soc = telemetry?.battery_soc_pct || 0;
  const coolant = telemetry?.coolant_temp_c || 0;

  const series = (key) => history.map((h) => h[key]);

  const oilLow = oilP < 220;
  const rpmHigh = rpm > 5600;

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <h2 className="sec-title">Propulsion Vitals</h2>
        <span className="sec-note">FADEC · CAN 0x0CF00400 · {history.length > 1 ? `${history.length} samples` : 'buffering'}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-white/[0.06]">
        <Vital
          label="Crankshaft"
          value={Math.round(rpm).toLocaleString()}
          unit="rpm"
          sub={`${throttle.toFixed(0)}% thr`}
          trend={series('rpm')}
          alert={rpmHigh}
          gauge={<ArcGauge value={rpm} max={6000} color={rpmHigh ? '#d9a441' : '#7aa2c4'} />}
        />

        <Vital
          label="Manifold Press"
          value={mapKpa.toFixed(1)}
          unit="kPa"
          sub={`${(telemetry?.map_inhg || 0).toFixed(1)} inHg`}
          trend={series('map')}
          gauge={<ArcGauge value={mapKpa} max={160} color="#7aa2c4" />}
        />

        <Vital
          label="Oil Pressure"
          value={Math.round(oilP)}
          unit="kPa"
          sub={`${oilT.toFixed(0)}°C oil`}
          trend={series('oilP')}
          alert={oilLow}
          gauge={<ArcGauge value={oilP} max={550} color={oilLow ? '#d96b6b' : '#5fb87f'} />}
        />

        <Vital
          label="Fuel Flow"
          value={fuel.toFixed(1)}
          unit="L/h"
          sub={`${Math.round(telemetry?.bsfc_g_kwh || 0)} g/kWh`}
          trend={series('fuel')}
          color="#5fb87f"
          gauge={<ArcGauge value={fuel} max={40} color="#5fb87f" />}
        />

        <Vital
          label="Shaft Power"
          value={bhp.toFixed(1)}
          unit="bhp"
          sub={`${(telemetry?.torque_nm || 0).toFixed(0)} N·m`}
          trend={series('bhp')}
          gauge={<ArcGauge value={bhp} max={150} color="#7aa2c4" />}
        />

        <Vital
          label="Electrical"
          value={volts.toFixed(1)}
          unit="V"
          sub={`${amps.toFixed(0)} A · ${soc.toFixed(0)}% SOC`}
          trend={series('volts')}
          gauge={<ArcGauge value={volts} min={10} max={15} color="#7aa2c4" />}
        />
      </div>

      <div className="px-4 py-2 border-t border-white/[0.06] flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="font-mono text-2xs text-zinc-600">
          COOLANT <span className="text-zinc-400">{coolant.toFixed(1)}°C</span>
        </span>
        <span className="font-mono text-2xs text-zinc-600">
          TURBO <span className="text-zinc-400">{Math.round((telemetry?.turbo_rpm || 0) / 1000)}k rpm</span>
        </span>
        <span className="font-mono text-2xs text-zinc-600">
          IGN ADV <span className="text-zinc-400">{(telemetry?.ignition_advance_deg ?? 0).toFixed(1)}°</span>
        </span>
        <span className="font-mono text-2xs text-zinc-600">
          INJ <span className="text-zinc-400">{(telemetry?.injection_pulse_ms ?? 0).toFixed(2)} ms</span>
        </span>
        <span className="font-mono text-2xs text-zinc-600">
          σ <span className="text-zinc-400">{(telemetry?.density_ratio_sigma ?? 0).toFixed(3)}</span>
        </span>
      </div>
    </section>
  );
}
