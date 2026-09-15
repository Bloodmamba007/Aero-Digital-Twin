import React from 'react';
import Sparkline from './Sparkline';

const BIN_HZ = 62.5;

export default function VibrationSpectrum({ telemetry, history }) {
  const rmsG = telemetry?.vibration_rms_g || 0;
  const spectrum = telemetry?.vibration_spectrum || {};
  const bins = spectrum.spectral_bins || [];
  const rpm = telemetry?.rpm || 0;

  const shaftHz = rpm / 60;
  const peak = Math.max(0.5, ...bins);
  const isHigh = rmsG > 3.0;
  const isElevated = rmsG > 2.0;

  const h1 = spectrum.harmonic_1x_g ?? 0;
  const h2 = spectrum.harmonic_2x_g ?? 0;
  const hT = spectrum.high_freq_turb_g ?? 0;

  return (
    <section className="card p-4">
      <div className="sec-head">
        <h2 className="sec-title">Vibration Spectrum</h2>
        <div className="flex items-center gap-2.5">
          <Sparkline data={history.map((s) => s.vib)} color={isHigh ? '#d96b6b' : '#7aa2c4'} width={70} height={20} fill={false} />
          <span className={`chip ${isHigh ? 'chip-crit' : isElevated ? 'chip-warn' : 'chip-ok'}`}>
            {rmsG.toFixed(2)} G rms
          </span>
        </div>
      </div>

      {/* FFT bars */}
      <div className="relative">
        <div className="h-24 flex items-end gap-[2px]">
          {bins.map((val, idx) => {
            const freq = idx * BIN_HZ;
            const is1X = Math.abs(freq - shaftHz) < BIN_HZ / 2;
            const is2X = Math.abs(freq - shaftHz * 2) < BIN_HZ / 2;
            const isTurbo = freq > 1400;

            let bg = 'rgba(122,162,196,0.45)';
            if (is1X || is2X) bg = '#d9a441';
            if (isTurbo && val > 1.0) bg = '#d96b6b';

            return (
              <div
                key={idx}
                className="flex-1 rounded-t-[1px] transition-all duration-200"
                style={{ height: `${Math.max(2, (val / peak) * 100)}%`, background: bg }}
                title={`${freq.toFixed(0)} Hz · ${val.toFixed(3)} G`}
              />
            );
          })}
        </div>

        {/* frequency axis */}
        <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/[0.07] font-mono text-2xs text-zinc-600">
          <span>0</span>
          <span>500</span>
          <span>1000</span>
          <span>1500</span>
          <span>2000 Hz</span>
        </div>
      </div>

      {/* Harmonic orders */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-4">
        <div>
          <span className="label">1X shaft</span>
          <div className="flex items-baseline mt-1">
            <span className={`num-md ${h1 > 1.2 ? 'text-warn' : ''}`}>{h1.toFixed(2)}</span>
            <span className="unit">G</span>
          </div>
          <span className="font-mono text-2xs text-zinc-600">{shaftHz.toFixed(0)} Hz</span>
        </div>
        <div>
          <span className="label">2X recip</span>
          <div className="flex items-baseline mt-1">
            <span className="num-md">{h2.toFixed(2)}</span>
            <span className="unit">G</span>
          </div>
          <span className="font-mono text-2xs text-zinc-600">{(shaftHz * 2).toFixed(0)} Hz</span>
        </div>
        <div>
          <span className="label">Turbo mesh</span>
          <div className="flex items-baseline mt-1">
            <span className={`num-md ${hT > 1.5 ? 'text-crit' : ''}`}>{hT.toFixed(2)}</span>
            <span className="unit">G</span>
          </div>
          <span className="font-mono text-2xs text-zinc-600">&gt;1.4 kHz</span>
        </div>
      </div>
    </section>
  );
}
